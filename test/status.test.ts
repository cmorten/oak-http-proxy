import { describe, it } from "./support/utils.ts";
import { expect, Oak, Opine, superoak } from "./deps.ts";
import { proxy } from "../mod.ts";

const { opine } = Opine;
const { Application, Router } = Oak;

describe("proxies status code", () => {
  [304, 404, 200, 401, 500].forEach((status) => {
    it(`should handle a "${status}" proxied status code`, async (done) => {
      const target = opine();

      target.use("/status/:status", (req, res) => {
        res.sendStatus(parseInt(req.params.status));
      });

      const targetServer = target.listen();
      const targetPort = (targetServer.listener.addr as Deno.NetAddr).port;

      const router = new Router();
      router.get(
        "/status/:status",
        proxy(`http://localhost:${targetPort}`, {
          proxyReqUrlDecorator: (url, req) => {
            url.pathname = req.url.pathname;

            return url;
          },
        }),
      );

      const app = new Application();
      app.use(router.routes());
      app.use(router.allowedMethods());

      const request = await superoak(app);
      request.get(`/status/${status}`)
        .end((err, res) => {
          targetServer.close();
          expect(res.status).toEqual(status);
          done(err);
        });
    });
  });
});
