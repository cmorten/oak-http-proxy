// deno-lint-ignore-file no-explicit-any
import { describe, it } from "./support/utils.ts";
import { proxyTarget } from "./support/proxyTarget.ts";
import { expect, Oak } from "./deps.ts";
import { proxy, ProxyOptions } from "../mod.ts";

const { Application, Router } = Oak;

function chunkingProxyServer() {
  const proxyRouteFn = [{
    method: "get",
    path: "/stream",
    fn: function (_req: any, res: any) {
      let timer: number | undefined = undefined;
      let counter = 0;

      const body = new ReadableStream({
        start(controller) {
          timer = setInterval(() => {
            if (counter > 3) {
              clearInterval(timer);
              controller.close();

              return;
            }

            const message = `${counter}`;
            controller.enqueue(new TextEncoder().encode(message));
            counter++;
          }, 50);
        },

        cancel() {
          if (timer !== undefined) {
            clearInterval(timer);
          }
        },
      });

      res.end(body);
    },
  }];

  return proxyTarget({ port: 8309, timeout: 1000, handlers: proxyRouteFn });
}

const decoder = new TextDecoder();

async function simulateUserRequest() {
  const response = await fetch("http://localhost:8308/stream");
  const chunks = [];

  for await (const chunk of response.body!) {
    const decodedChunk = decoder.decode(chunk);
    chunks.push(decodedChunk);
  }

  return chunks;
}

async function startLocalServer(proxyOptions: ProxyOptions) {
  const router = new Router();

  router.get("/stream", proxy("http://localhost:8309/stream", proxyOptions));

  const app = new Application();
  app.use(router.routes());
  app.use(router.allowedMethods());

  const controller = new AbortController();
  const { signal } = controller;

  let listenerPromiseResolver!: () => void;

  const listenerPromise = new Promise<void>((resolve) => {
    listenerPromiseResolver = resolve;
  });

  app.addEventListener("listen", () => listenerPromiseResolver());

  const serverPromise = app.listen({
    hostname: "localhost",
    port: 8308,
    signal,
  });

  await listenerPromise;

  return { controller, serverPromise };
}

describe("streams / piped requests", function () {
  describe("when streaming options are truthy", function () {
    const TEST_CASES = [{
      name: "vanilla, no options defined",
      options: {},
    }, {
      name: "proxyReqOptDecorator is defined",
      options: {
        proxyReqInitDecorator: function (reqInit: any) {
          return reqInit;
        },
      },
    }, {
      name: "proxyReqOptDecorator is a Promise",
      options: {
        proxyReqInitDecorator: function (reqInit: any) {
          return Promise.resolve(reqInit);
        },
      },
    }];

    TEST_CASES.forEach(function (testCase) {
      describe(testCase.name, function () {
        it(
          testCase.name +
            ": chunks are received without any buffering, e.g. before request end",
          async function (done) {
            const targetServer = chunkingProxyServer();
            const { controller, serverPromise } = await startLocalServer(
              testCase.options,
            );

            simulateUserRequest()
              .then(async function (res) {
                expect(res instanceof Array).toBeTruthy();
                expect(res).toHaveLength(4);

                controller.abort();
                await serverPromise;

                targetServer.close();

                done();
              })
              .catch(async (error) => {
                controller.abort();
                await serverPromise;

                targetServer.close();

                done(error);
              });
          },
        );
      });
    });
  });

  describe("when streaming options are falsy", function () {
    const TEST_CASES = [{
      name: "filterRes is defined",
      options: {
        filterRes: function () {
          return false;
        },
      },
    }];

    TEST_CASES.forEach(function (testCase) {
      describe(testCase.name, function () {
        it("response arrives in one large chunk", async function (done) {
          const targetServer = chunkingProxyServer();
          const { controller, serverPromise } = await startLocalServer(
            testCase.options,
          );

          simulateUserRequest()
            .then(async function (res) {
              expect(res instanceof Array).toBeTruthy();
              expect(res).toHaveLength(1);

              controller.abort();
              await serverPromise;

              targetServer.close();

              done();
            })
            .catch(async (error) => {
              controller.abort();
              await serverPromise;

              targetServer.close();

              done(error);
            });
        });
      });
    });
  });
});
