import type { ProxyState } from "../../deps.ts";

const isNullBodyStatus = (status: number) =>
  status === 101 || status === 204 || status === 205 || status === 304;

export function sendSrcRes(state: ProxyState) {
  if (state.options.stream) {
    state.src.res.body = state.proxy.res?.body;
  } else if (!isNullBodyStatus(state.src.res.status)) {
    state.src.res.body = state.proxy.resData;
  }

  return Promise.resolve(state);
}
