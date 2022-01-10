import { describe, it } from "./support/utils.ts";
import { expect, Oak, Opine, superoak } from "./deps.ts";
import { proxy } from "../mod.ts";

const { Application } = Oak;
const { opine } = Opine;

describe("when userResHeaderDecorator is defined", () => {
  it("provides an interface for updating headers", async (done) => {
    // Create a server to proxy through to.
    // Using Opine as simpler to retrieve the target port than Oak.
    const target = opine();
    target.use((req, res) => {
      res.json(req.headers);
    });
    const targetServer = target.listen();
    const targetPort = (targetServer.addrs[0] as Deno.NetAddr).port;

    // Setup Oak with proxy middleware.
    const app = new Application();
    app.use(proxy(`http://localhost:${targetPort}`, {
      srcResHeaderDecorator: (headers) => {
        headers.set("x-proxy", "oak-http-proxy");

        return headers;
      },
    }));

    const request = await superoak(app);

    request.get("/proxy")
      .end((err, res) => {
        targetServer.close();
        expect(res.header["x-proxy"]).toEqual("oak-http-proxy");
        done(err);
      });
  });
});
