import type { ProxyState } from "../../deps.ts";

export function sendSrcRes(state: ProxyState) {
  state.src.res.body = state.proxy.resData;

  return Promise.resolve(state);
}
