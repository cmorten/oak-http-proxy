import { describe, it } from "./support/utils.ts";
import { proxyTarget } from "./support/proxyTarget.ts";
import { expect, Oak, Opine, superoak } from "./deps.ts";
import { proxy } from "../mod.ts";

const { Application, Router } = Oak;
const { opine } = Opine;

const proxyRoutes = [
  "/somePath/",
  "/somePath/longer/path",
  "/somePath/long/path/with/many/tokens",
];

describe("url: string", () => {
  proxyRoutes.forEach((path) => {
    it(`should work independently of "${path}" from the inbound request to proxy to the remote server (url: string)`, async (done) => {
      const proxyRouteFn = {
        method: "get",
        path: "/",
        fn: (req: any, res: any) => {
          res.json({ path });
        },
      };

      const target = proxyTarget({ handlers: [proxyRouteFn] });
      const targetPort = (target.addrs[0] as Deno.NetAddr).port;

      const router = new Router();
      router.get("/somePath/(.*)", proxy(`http://localhost:${targetPort}`));

      const app = new Application();
      app.use(router.routes());
      app.use(router.allowedMethods());

      const request = await superoak(app);
      request.get(path)
        .expect(200)
        .end((err, res) => {
          expect(res.body.path).toEqual(path);
          target.close();
          done(err);
        });
    });
  });
});

describe("url: URL", () => {
  proxyRoutes.forEach((path) => {
    it(`should use the unmatched path component of "${path}" from the inbound request to proxy to the remote server (url: URL)`, async (done) => {
      const proxyRouteFn = {
        method: "get",
        path: "/",
        fn: (req: any, res: any) => {
          res.json({ path });
        },
      };

      const target = proxyTarget({ handlers: [proxyRouteFn] });
      const targetPort = (target.addrs[0] as Deno.NetAddr).port;

      const router = new Router();
      router.get(
        "/somePath/(.*)",
        proxy(new URL(`http://localhost:${targetPort}`)),
      );

      const app = new Application();
      app.use(router.routes());
      app.use(router.allowedMethods());

      const request = await superoak(app);
      request.get(path)
        .expect(200)
        .end((err, res) => {
          expect(res.body.path).toEqual(path);
          target.close();
          done(err);
        });
    });
  });
});

describe("url: function", () => {
  it("should handle a dynamic url function", async (done) => {
    const firstProxyApp = opine();
    const secondProxyApp = opine();

    const firstPort = 10031;
    const secondPort = 10032;

    firstProxyApp.use("/", (_req, res) => res.sendStatus(204));
    secondProxyApp.use("/", (_req, res) => res.sendStatus(200));

    const firstServer = firstProxyApp.listen(firstPort);
    const secondServer = secondProxyApp.listen(secondPort);

    const router = new Router();
    router.get(
      "/proxy/:port",
      proxy(
        (ctx) => `http://localhost:${ctx.params.port}`,
        { memoizeUrl: false },
      ),
    );

    const app = new Application();
    app.use(router.routes());
    app.use(router.allowedMethods());

    (await superoak(app))
      .get(`/proxy/${firstPort}`)
      .expect(204)
      .end(async (err) => {
        console.log(err);
        firstServer.close();
        if (err) return done(err);

        (await superoak(app))
          .get(`/proxy/${secondPort}`)
          .expect(200, (err) => {
            secondServer.close();
            done(err);
          });
      });
  });
});
