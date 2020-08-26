import { STATUS_TEXT } from "../../deps.ts";

function connectionResetHandler(ctx: any) {
  ctx.response.headers.set(
    "X-Timeout-Reason",
    "oak-http-proxy reset the request.",
  );
  ctx.response.status = 504;
  ctx.response.body = STATUS_TEXT.get(504);
}

export function handleProxyErrors(err: any, ctx: any) {
  if (err && err.code === "ECONNRESET" || err.code === "ECONTIMEDOUT") {
    connectionResetHandler(ctx);
  } else {
    ctx.throw(err);
  }
}
