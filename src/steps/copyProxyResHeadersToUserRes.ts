import { ProxyState } from "../../deps.ts";

export function copyProxyResHeadersToUserRes(state: ProxyState) {
  const res = state.src.res;
  const rsp = state.proxy.res as Response;

  res.status = rsp.status;

  Array.from(rsp.headers.entries())
    .forEach(([field, value]) => {
      if (field.toLowerCase() !== "transfer-encoding") {
        res.headers.append(field, value);
      }
    });

  return Promise.resolve(state);
}
