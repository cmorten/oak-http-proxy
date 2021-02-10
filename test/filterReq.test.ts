import { describe, it } from "./support/utils.ts";
import { proxyTarget } from "./support/proxyTarget.ts";
import { Oak, superoak } from "./deps.ts";
import { proxy } from "../mod.ts";

const { Application } = Oak;

const proxyRouteFn = [{
  method: "get",
  path: "/",
  fn: (req: any, res: any) => {
    return res.setStatus(200).send("Proxy Server");
  },
}];

function nextMethod(ctx: any, next: any) {
  ctx.response.status = 201;
  ctx.response.body = "Client Application";
}

describe("filterReq", () => {
  it("should continue route processing when the filter function returns false (i.e. don't filter)", async (
    done,
  ) => {
    const proxyServer = proxyTarget({ handlers: proxyRouteFn });
    const proxyPort = (proxyServer.listener.addr as Deno.NetAddr).port;

    const app = new Application();
    app.use(proxy(`http://localhost:${proxyPort}`, {
      filterReq: () => false,
    }));
    app.use(nextMethod);

    const request = await superoak(app);

    request.get("/")
      .expect(200)
      .end((err) => {
        proxyServer.close();
        done(err);
      });
  });

  it("should stop route processing when the filter function returns true (i.e. filter)", async (
    done,
  ) => {
    const proxyServer = proxyTarget({ handlers: proxyRouteFn });
    const proxyPort = (proxyServer.listener.addr as Deno.NetAddr).port;

    const app = new Application();
    app.use(proxy(`http://localhost:${proxyPort}`, {
      filterReq: () => true,
    }));
    app.use(nextMethod);

    const request = await superoak(app);

    request.get("/")
      .expect(201)
      .end((err) => {
        proxyServer.close();
        done(err);
      });
  });

  it("should continue route processing when the filter function returns Promise<false> (i.e. don't filter)", async (
    done,
  ) => {
    const proxyServer = proxyTarget({ handlers: proxyRouteFn });
    const proxyPort = (proxyServer.listener.addr as Deno.NetAddr).port;

    const app = new Application();
    app.use(proxy(`http://localhost:${proxyPort}`, {
      filterReq: () => Promise.resolve(false),
    }));
    app.use(nextMethod);

    const request = await superoak(app);

    request.get("/")
      .expect(200)
      .end((err) => {
        proxyServer.close();
        done(err);
      });
  });

  it("should stop route processing when the filter function returns Promise<true> (i.e. filter)", async (
    done,
  ) => {
    const proxyServer = proxyTarget({ handlers: proxyRouteFn });
    const proxyPort = (proxyServer.listener.addr as Deno.NetAddr).port;

    const app = new Application();
    app.use(proxy(`http://localhost:${proxyPort}`, {
      filterReq: () => Promise.resolve(true),
    }));
    app.use(nextMethod);

    const request = await superoak(app);

    request.get("/")
      .expect(201)
      .end((err) => {
        proxyServer.close();
        done(err);
      });
  });
});
