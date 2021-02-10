import { describe, it } from "./support/utils.ts";
import { proxyTarget } from "./support/proxyTarget.ts";
import { expect, Oak, superoak } from "./deps.ts";
import { proxy } from "../mod.ts";

const { Application } = Oak;

const REMOTE_SERVER_LATENCY = 500;

const timeoutManager = {
  resolver: () => {},
  promise: Promise.resolve(),
  respond: true,
  reset() {
    this.respond = true;
    this.promise = new Promise((resolve) => {
      this.resolver = resolve;
    });
  },
  async close() {
    this.respond = false;
    return await this.end();
  },
  async end() {
    return await this.promise;
  },
};

const proxyRouteFn = [
  {
    method: "get",
    path: "/:errorCode",
    fn: async (req: any, res: any) => {
      setTimeout(() => {
        timeoutManager.resolver();

        if (timeoutManager.respond) {
          const errorCode = req.params.errorCode;

          if (errorCode === "timeout") {
            return res.setStatus(504).send("test-timeout");
          }

          res.setStatus(parseInt(errorCode)).send("test-case-error");
        }
      }, REMOTE_SERVER_LATENCY);
    },
  },
];

describe("error handling can be overridden by user", () => {
  describe("when user provides a null function", () => {
    describe("when a timeout is set that fires", () => {
      it("passes 504 directly to client", async (done) => {
        timeoutManager.reset();
        const targetServer = proxyTarget({ handlers: proxyRouteFn });
        const targetPort = (targetServer.listener.addr as Deno.NetAddr).port;

        const app = new Application();
        app.use(proxy(`http://localhost:${targetPort}/200`, { timeout: 0 }));

        const request = await superoak(app);

        request.get("/")
          .end(async (err, res) => {
            await timeoutManager.close();
            targetServer.close();
            expect(res.status).toEqual(504);
            expect(res.header["x-timeout-reason"]).toEqual(
              "oak-http-proxy reset the request.",
            );
            done();
          });
      });
    });

    describe("when a timeout is not set", () => {
      it("passes status code (e.g. 504) directly to the client", async (
        done,
      ) => {
        timeoutManager.reset();
        const targetServer = proxyTarget({ handlers: proxyRouteFn });
        const targetPort = (targetServer.listener.addr as Deno.NetAddr).port;

        const app = new Application();
        app.use(proxy(`http://localhost:${targetPort}/504`));

        const request = await superoak(app);

        request.get("/")
          .end(async (err, res) => {
            expect(res.status).toEqual(504);
            expect(res.text).toEqual("test-case-error");
            await timeoutManager.end();
            targetServer.close();
            done();
          });
      });

      it("passes status code (e.g. 500) back to the client", async (done) => {
        timeoutManager.reset();
        const targetServer = proxyTarget({ handlers: proxyRouteFn });
        const targetPort = (targetServer.listener.addr as Deno.NetAddr).port;

        const app = new Application();
        app.use(proxy(`http://localhost:${targetPort}/500`));

        const request = await superoak(app);

        request.get("/")
          .end(async (err, res) => {
            expect(res.status).toEqual(500);
            expect(res.text).toEqual("test-case-error");
            await timeoutManager.end();
            targetServer.close();
            done();
          });
      });
    });
  });

  describe("when user provides a handler function", () => {
    const statusCode = 418;
    const message =
      "Whoever you are, and wherever you may be, friendship is always granted over a good cup of tea.";

    describe("when a timeout is set that fires", () => {
      it("should use the provided handler function passing on the timeout error", async (
        done,
      ) => {
        timeoutManager.reset();
        const targetServer = proxyTarget({ handlers: proxyRouteFn });
        const targetPort = (targetServer.listener.addr as Deno.NetAddr).port;

        const app = new Application();
        app.use(proxy(`http://localhost:${targetPort}/200`, {
          timeout: 1,
          proxyErrorHandler: (err, ctx, next) => {
            ctx.response.status = statusCode;
            ctx.response.body = message;
          },
        }));

        const request = await superoak(app);

        request.get("/")
          .end(async (err, res) => {
            await timeoutManager.close();
            targetServer.close();
            expect(res.status).toEqual(statusCode);
            expect(res.text).toEqual(message);
            done();
          });
      });
    });

    describe("when the remote server is down", () => {
      it("should use the provided handler function passing on the connection refused error", async (
        done,
      ) => {
        const targetServer = proxyTarget({ handlers: proxyRouteFn });
        const targetPort = (targetServer.listener.addr as Deno.NetAddr).port;
        targetServer.close();

        const app = new Application();
        app.use(proxy(`http://localhost:${targetPort}/200`, {
          proxyErrorHandler: (err, ctx, next) => {
            ctx.response.status = statusCode;
            ctx.response.body = message;
          },
        }));

        const request = await superoak(app);

        request.get("/")
          .end((err, res) => {
            expect(res.status).toEqual(statusCode);
            expect(res.text).toEqual(message);
            done();
          });
      });
    });
  });
});
