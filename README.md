# oak-http-proxy

Proxy middleware for Deno Oak HTTP servers.

[![GitHub tag](https://img.shields.io/github/tag/asos-craigmorten/oak-http-proxy)](https://github.com/asos-craigmorten/oak-http-proxy/tags/) ![Test](https://github.com/asos-craigmorten/oak-http-proxy/workflows/Test/badge.svg) [![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/oak-http-proxy/mod.ts) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com) [![GitHub issues](https://img.shields.io/github/issues/asos-craigmorten/oak-http-proxy)](https://img.shields.io/github/issues/asos-craigmorten/oak-http-proxy)
![GitHub stars](https://img.shields.io/github/stars/asos-craigmorten/oak-http-proxy) ![GitHub forks](https://img.shields.io/github/forks/asos-craigmorten/oak-http-proxy) ![oak-http-proxy License](https://img.shields.io/github/license/asos-craigmorten/oak-http-proxy) [![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/asos-craigmorten/oak-http-proxy/graphs/commit-activity) [![HitCount](http://hits.dwyl.com/asos-craigmorten/oak-http-proxy.svg)](http://hits.dwyl.com/asos-craigmorten/oak-http-proxy)

```ts
import { proxy } from "https://deno.land/x/oak-http-proxy@1.0.0/mod.ts";
import { Application } from "https://deno.land/x/oak@v6.0.2/mod.ts";

const app = new Application();

app.use(proxy("https://github.com/oakserver/oak"));

await app.listen({ port: 3000 });
```

## Installation

This is a [Deno](https://deno.land/) module available to import direct from this repo and via the [Deno Registry](https://deno.land/x).

Before importing, [download and install Deno](https://deno.land/#installation).

You can then import oak-http-proxy straight into your project:

```ts
import { proxy } from "https://deno.land/x/oak-http-proxy@1.0.0/mod.ts";
```

oak-http-proxy is also available on [nest.land](https://nest.land/package/oak-http-proxy), a package registry for Deno on the Blockchain.

```ts
import { opine } from "https://x.nest.land/oak-http-proxy@1.0.0/mod.ts";
```

## Docs

- [oak-http-proxy Type Docs](https://asos-craigmorten.github.io/oak-http-proxy/)
- [oak-http-proxy Deno Docs](https://doc.deno.land/https/deno.land/x/oakHttpProxy/mod.ts)
- [License](https://github.com/asos-craigmorten/oak-http-proxy/blob/main/LICENSE.md)
- [Changelog](https://github.com/asos-craigmorten/oak-http-proxy/blob/main/.github/CHANGELOG.md)

## Usage

### URL

The url argument that can be a string, URL or a function that returns a string or URL. This is used as the url to proxy requests to. Query string parameters and hashes are transferred from incoming request urls onto the proxy url.

```ts
router.get("/string", proxy("http://google.com"));

router.get("/url", proxy(new URL("http://google.com")));

router.get("/function", proxy((ctx) => new URL("http://google.com")));
```

Note: Unmatched path segments of the incoming request url _are not_ transferred to the outbound proxy URL. For dynamic proxy urls use the function form.

### Proxy Options

You can also provide several options which allow you to filter, customize and decorate proxied requests and responses.

```ts
app.use(proxy("http://google.com", proxyOptions));
```

#### filterReq(req, res) (supports Promises)

The `filterReq` option can be used to limit what requests are proxied.

Return false to continue to execute the proxy; return true to skip the proxy for this request.

```ts
app.use(
  "/proxy",
  proxy("www.google.com", {
    filterReq: (req, res) => {
      return req.method === "GET";
    },
  })
);
```

Promise form:

```ts
app.use(
  proxy("localhost:12346", {
    filterReq: (req, res) => {
      return new Promise((resolve) => {
        resolve(req.method === "GET");
      });
    },
  })
);
```

#### srcResDecorator(req, res, proxyRes, proxyResData) (supports Promise)

Decorate the inbound response object from the proxied request.

```ts
router.get(
  "/proxy",
  proxy("www.google.com", {
    srcResDecorator: (req, res, proxyRes, proxyResData) => {
      data = JSON.parse(proxyResData.toString("utf8"));
      data.newProperty = "exciting data";

      return JSON.stringify(data);
    },
  })
);
```

```ts
app.use(
  proxy("httpbin.org", {
    srcResDecorator: (req, res, proxyRes, proxyResData) => {
      return new Promise((resolve) => {
        proxyResData.message = "Hello Deno!";

        setTimeout(() => {
          resolve(proxyResData);
        }, 200);
      });
    },
  })
);
```

##### 304 - Not Modified

When your proxied service returns 304 Not Modified this step will be skipped, since there should be no body to decorate.

##### Exploiting references

The intent is that this be used to modify the proxy response data only.

Note: The other arguments are passed by reference, so you _can_ currently exploit this to modify either response's headers, for instance, but this is not a reliable interface.

#### memoizeUrl

Defaults to `true`.

When true, the `url` argument will be parsed on first request, and memoized for subsequent requests.

When `false`, `url` argument will be parsed on each request.

For example:

```ts
function coinToss() {
  return Math.random() > 0.5;
}

function getUrl() {
  return coinToss() ? "http://yahoo.com" : "http://google.com";
}

app.use(
  proxy(getUrl, {
    memoizeUrl: false,
  })
);
```

In this example, when `memoizeUrl: false`, the coinToss occurs on each request, and each request could get either value.

Conversely, When `memoizeUrl: true`, the coinToss would occur on the first request, and all additional requests would return the value resolved on the first request.

### srcResHeaderDecorator

Decorate the inbound response headers from the proxied request.

```ts
router.get(
  "/proxy",
  proxy("www.google.com", {
    srcResHeaderDecorator(headers, req, res, proxyReq, proxyRes) {
      return headers;
    },
  })
);
```

#### filterRes(proxyRes, proxyResData) (supports Promise form)

Allows you to inspect the proxy response, and decide if you want to continue processing (via oak-http-proxy) or continue onto the next middleware.

```ts
router.get(
  "/proxy",
  proxy("www.google.com", {
    filterRes(proxyRes) {
      return proxyRes.status === 404;
    },
  })
);
```

### proxyErrorHandler

By default, `oak-http-proxy` will throw any errors except `ECONNRESET` and `ECONTIMEDOUT` via `ctx.throw(err)`, so that your application can handle or react to them, or just drop through to your default error handling.

If you would like to modify this behavior, you can provide your own `proxyErrorHandler`.

```ts
// Example of skipping all error handling.

app.use(
  proxy("localhost:12346", {
    proxyErrorHandler(err, ctx, next) {
      ctx.throw(err);
    },
  })
);

// Example of rolling your own error handler

app.use(
  proxy("localhost:12346", {
    proxyErrorHandler(err, ctx, next) {
      switch (err && err.code) {
        case "ECONNRESET": {
          ctx.response.status = 405;

          return;
        }
        case "ECONNREFUSED": {
          ctx.response.status = 200;

          return;
        }
        default: {
          ctx.throw(err)
        }
      }
    },
  })
);
```

#### proxyReqUrlDecorator(url, req) (supports Promise form)

Decorate the outbound proxied request url.

The returned url is used for the `fetch` method internally.

```ts
router.get(
  "/proxy",
  proxy("www.google.com", {
    proxyReqUrlDecorator(url, req) {
      url.pathname = "/";

      return url;
    },
  })
);
```

You can also use Promises:

```ts
router.get(
  "/proxy",
  proxy("localhost:3000", {
    proxyReqOptDecorator(url, req) {
      return new Promise((resolve, reject) => {
        if (url.pathname === "/login") {
          url.port = 8080;
        }

        resolve(url);
      });
    },
  })
);
```

Generally it is advised to use the function form for the passed URL argument as this provides the full context object whereas the `proxyReqOptDecorator` passes only the `context.request` object.

Potential use cases for `proxyReqOptDecorator` include:

- Overriding default protocol behaviour.
- Overriding default query-string and hash transfer behaviour.

#### proxyReqInitDecorator(proxyReqOpts, req) (supports Promise form)

Decorate the outbound proxied request initialization options.

This configuration will be used within the `fetch` method internally to make the request to the provided url.

```ts
router.get(
  "/proxy",
  proxy("www.google.com", {
    proxyReqInitDecorator(proxyReqOpts, srcReq) {
      // you can update headers
      proxyReqOpts.headers.set("Content-Type", "text/html");
      // you can change the method
      proxyReqOpts.method = "GET";

      return proxyReqOpts;
    },
  })
);
```

You can also use Promises:

```ts
router.get(
  "/proxy",
  proxy("www.google.com", {
    proxyReqOptDecorator(proxyReqOpts, srcReq) {
      return new Promise((resolve, reject) => {
        proxyReqOpts.headers.set("Content-Type", "text/html");

        resolve(proxyReqOpts);
      });
    },
  })
);
```

#### secure

Normally, your proxy request will be made on the same protocol as the `url` parameter. If you'd like to force the proxy request to be https, use this option.

```ts
app.use(
  "/proxy",
  proxy("http://www.google.com", {
    secure: true,
  })
);
```

Note: if the proxy is passed a url without a protocol then HTTP will be used by default unless overridden by this option.

#### preserveHostHeader

You can copy the host HTTP header to the proxied Oak server using the `preserveHostHeader` option.

```ts
router.get(
  "/proxy",
  proxy("www.google.com", {
    preserveHostHeader: true,
  })
);
```

#### parseReqBody

The `parseReqBody` option allows you to control whether the request body should be parsed and sent with the proxied request. If set to `false` then an incoming request body will not be sent with the proxied request.

#### reqAsBuffer

Configure whether the proxied request body should be sent as a UInt8Array buffer.

Ignored if `parseReqBody` is set to `false`.

```ts
router.get(
  "/proxy",
  proxy("www.google.com", {
    reqAsBuffer: true,
  })
);
```

#### reqBodyEncoding

The request body encoding to use. Currently only "utf-8" is supported.

Ignored if `parseReqBody` is set to `false`.

```ts
router.get(
  "/post",
  proxy("httpbin.org", {
    reqBodyEncoding: "utf-8",
  })
);
```

#### timeout

Configure a timeout in ms for the outbound proxied request.

If not provided the request will never time out.

Timed-out requests will respond with 504 status code and a X-Timeout-Reason header.

```ts
router.get(
  "/",
  proxy("httpbin.org", {
    timeout: 2000, // in milliseconds, two seconds
  })
);
```

## Contributing

[Contributing guide](https://github.com/asos-craigmorten/oak-http-proxy/blob/main/.github/CONTRIBUTING.md)

---

## License

oak-http-proxy is licensed under the [MIT License](./LICENSE.md).
