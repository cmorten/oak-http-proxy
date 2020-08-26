import { describe, it } from "./support/utils.ts";
import { superoak, expect, Oak } from "./deps.ts";
import { proxy } from "../mod.ts";

const { Application } = Oak;

describe("proxies headers", () => {
  it("should pass on headers set as options", async (done) => {
    const app = new Application();
    app.use(proxy("http://httpbin.org/headers", {
      headers: {
        "X-Deno": "oak-http-proxy",
      },
    }));

    const request = await superoak(app);
    request.get("/")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.headers["X-Deno"]).toEqual("oak-http-proxy");
        done();
      });
  });

  it("should pass on headers set on the request", async (done) => {
    const app = new Application();
    app.use(proxy("http://httpbin.org/headers", {
      headers: {
        "X-Deno": "oak-http-proxy",
      },
    }));

    const request = await superoak(app);
    request.get("/")
      .set("X-Powered-By", "Deno")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.headers["X-Powered-By"]).toEqual("Deno");
        done();
      });
  });
});
