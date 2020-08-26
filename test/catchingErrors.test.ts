import { describe, it } from "./support/utils.ts";
import { superoak, expect, Oak, Opine } from "./deps.ts";
import { proxy } from "../mod.ts";

const { Application, Router } = Oak;
const { opine } = Opine;

const STATUS_CODES = [
  {
    code: 403,
    text: "Forbidden",
    toString: /Error\: cannot GET http\:\/\/127.0.0.1\:\d+\/proxy \(403\)/,
  },
  {
    code: 404,
    text: "Not Found",
    toString: /Error\: cannot GET http\:\/\/127.0.0.1\:\d+\/proxy \(404\)/,
  },
  {
    code: 500,
    text: "Internal Server Error",
    toString: /Error\: cannot GET http\:\/\/127\.0\.0\.1\:\d+\/proxy \(500\)/,
  },
];

describe("when server responds with an error", () => {
  STATUS_CODES.forEach((statusCode) => {
    it(`oak-http-proxy responds with ${statusCode.text} when proxy server responds ${statusCode.code}`, async (
      done,
    ) => {
      // Create a server to proxy through to.
      // Using Opine as simpler to retrieve the target port than Oak.
      const target = opine();
      target.use(function (req, res) {
        res.sendStatus(statusCode.code);
      });
      const targetServer = target.listen(0);
      const targetPort = (targetServer.listener.addr as Deno.NetAddr).port;

      // Setup Oak router with proxy middleware applied to `/proxy` route.
      const router = new Router();
      router.get(
        "/proxy",
        proxy(`http://localhost:${targetPort}`, {
          reqAsBuffer: true,
          reqBodyEncoding: null,
          parseReqBody: false,
        }),
      );

      // Initialise Oak application with router.
      const app = new Application();
      app.use(router.routes());
      app.use(router.allowedMethods());

      const request = await superoak(app);

      request.get("/proxy")
        .end((err, res) => {
          targetServer.close();
          expect(res.status).toEqual(statusCode.code);
          expect(res.text).toEqual(statusCode.text);
          expect(res.error).toBeDefined();
          expect(res.error.toString()).toMatch(statusCode.toString);
          done(err);
        });
    });
  });
});
