import { describe, it } from "./support/utils.ts";
import { proxyTarget } from "./support/proxyTarget.ts";
import { Oak, superoak } from "./deps.ts";
import { proxy } from "../mod.ts";

const { Application } = Oak;

const proxyRouteFn = [
  {
    method: "get",
    path: "/",
    fn: (req: any, res: any) => {
      res.send("Hello Deno");
    },
  },
];

describe("url parsing", () => {
  it("can parse a local url with a port", async (done) => {
    const target = proxyTarget({ handlers: proxyRouteFn });
    const targetPort = (target.addrs[0] as Deno.NetAddr).port;

    const app = new Application();
    app.use(proxy(`http://localhost:${targetPort}`));

    const request = await superoak(app);
    request.get("/")
      .end((err) => {
        target.close();
        done(err);
      });
  });

  it("can parse a url with a port", async (done) => {
    const app = new Application();
    app.use(proxy("http://httpbin.org:80"));

    const request = await superoak(app);
    request.get("/")
      .end(done);
  });

  it("does not throw `Uncaught RangeError` if you have both a port and a trailing slash", async (done) => {
    const app = new Application();
    app.use(proxy("http://httpbin.org:80/"));

    const request = await superoak(app);
    request.get("/")
      .end(done);
  });
});
