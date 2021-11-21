import { describe, it } from "./support/utils.ts";
import { expect, Oak, superoak } from "./deps.ts";
import { proxy } from "../mod.ts";

const { Application } = Oak;

describe("proxies https", () => {
  async function assertSecureRequest(app: any, done: any) {
    const request = await superoak(app);

    request.get("/")
      .end((err, res) => {
        expect(res.body.headers["X-Forwarded-Port"]).toEqual("443");
        expect(res.body.headers["X-Forwarded-Proto"]).toEqual("https");
        done(err);
      });
  }

  it("should proxy via https for a string url with 'https' protocol", (done) => {
    const app = new Application();
    app.use(proxy("https://httpbin.org/get?show_env=1"));
    assertSecureRequest(app, done);
  });

  it("should proxy via https for a string url with 'http' protocol but 'secure' option set to true", (done) => {
    const app = new Application();
    app.use(proxy("http://httpbin.org/get?show_env=1", { secure: true }));
    assertSecureRequest(app, done);
  });

  it("should proxy via https for a function url with 'https' protocol", (done) => {
    const app = new Application();
    app.use(proxy(() => {
      return "https://httpbin.org/get?show_env=1";
    }));
    assertSecureRequest(app, done);
  });

  it("should proxy via https for a function url with 'http' protocol but 'secure' option set to true", (done) => {
    const app = new Application();
    app.use(proxy(() => {
      return "http://httpbin.org/get?show_env=1";
    }, { secure: true }));
    assertSecureRequest(app, done);
  });
});
