import type { ProxyState } from "../../deps.ts";
import { createRequestInit } from "../requestOptions.ts";

export function buildProxyReqInit(state: ProxyState) {
  const options = state.options;
  const req = state.src.req;

  return Promise.resolve(createRequestInit(req, options))
    .then((resolvedReqInit) => {
      state.proxy.reqInit = resolvedReqInit;

      return state;
    });
}
