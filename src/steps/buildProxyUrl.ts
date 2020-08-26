import { ProxyState } from "../../deps.ts";
import { parseUrl } from "../requestOptions.ts";

export function buildProxyUrl(ctx: any) {
  return function (state: ProxyState) {
    let parsedUrl;

    if (state.options.memoizeUrl) {
      parsedUrl = state.options.memoizedUrl = state.options.memoizedUrl ||
        parseUrl(state, ctx);
    } else {
      parsedUrl = parseUrl(state, ctx);
    }

    state.proxy.url = parsedUrl;

    return Promise.resolve(state);
  };
}
