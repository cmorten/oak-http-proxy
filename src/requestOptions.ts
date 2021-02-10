import type { ProxyOptions, ProxyState } from "../deps.ts";

export function parseUrl(state: ProxyState, ctx: any) {
  const req = state.src.req;
  const options = state.options;
  let url = state.params.url;

  if (typeof url === "function") {
    url = url(ctx);
  }

  url = new URL(`${req.url.search}${req.url.hash}`, url);

  const secure = typeof options.secure !== "undefined"
    ? options.secure
    : url.protocol === "https:"
    ? true
    : req.secure;

  url.protocol = secure ? "https:" : "http:";

  return url;
}

function extendHeaders(
  baseHeaders: HeadersInit,
  reqHeaders: Headers,
  ignoreHeaders: string[],
): Headers {
  const headers = new Headers(baseHeaders);

  if (!reqHeaders) {
    return headers;
  }

  reqHeaders.forEach((value, field) => {
    if (!ignoreHeaders.includes(field.toLowerCase())) {
      headers.set(field, value);
    }
  });

  return headers;
}

function reqHeaders(req: Request, options: ProxyOptions): Headers {
  const baseHeaders: HeadersInit = options.headers || {};
  const ignoreHeaders = ["connection", "content-length"];

  if (!options.preserveHostHeader) {
    ignoreHeaders.push("host");
  }

  const headers = extendHeaders(baseHeaders, req.headers, ignoreHeaders);
  headers.set("connection", "close");

  return headers;
}

export async function createRequestInit(
  req: any,
  options: ProxyOptions,
): Promise<RequestInit> {
  const body = options.parseReqBody && req.hasBody
    ? await req.body({ type: "text" }).value
    : null;

  return {
    body,
    cache: options.cache,
    credentials: options.credentials,
    integrity: options.integrity,
    keepalive: options.keepalive,
    mode: options.mode || "cors",
    redirect: options.redirect,
    referrer: options.referrer,
    referrerPolicy: options.referrerPolicy,
    signal: options.signal,
    headers: reqHeaders(req, options),
    method: options.method || req.method,
  };
}
