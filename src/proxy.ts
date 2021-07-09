import {
  createState,
  decorateProxyReqInit,
  decorateProxyReqUrl,
  decorateSrcRes,
  decorateSrcResHeaders,
  filterProxyRes,
  prepareProxyReq,
  ProxyOptions,
  ProxyUrlFunction,
  sendProxyReq,
} from "../deps.ts";
import { filterSrcReq } from "./steps/filterSrcReq.ts";
import { buildProxyUrl } from "./steps/buildProxyUrl.ts";
import { buildProxyReqInit } from "./steps/buildProxyReqInit.ts";
import { copyProxyResHeadersToUserRes } from "./steps/copyProxyResHeadersToUserRes.ts";
import { sendSrcRes } from "./steps/sendSrcRes.ts";
import { handleProxyErrors } from "./steps/handleProxyErrors.ts";

/**
 * Takes a url argument that can be a string, URL or a function
 * that returns one of the previous to proxy requests to. The
 * remaining path from a request that has not been matched by
 * Oak will be appended to the provided url when making the
 * proxy request.
 * 
 * Also accepts optional options configuration allowing the user
 * to modified all aspects of proxied request via option
 * properties or a series of hooks allowing decoration of the
 * outbound request and the inbound response objects.
 * 
 * Requests and responses can also be filtered via the `filterReq`
 * and `filterRes` function options, allowing requests to bypass
 * the proxy.
 * 
 * @param {string|URL|ProxyUrlFunction} url
 * @param {ProxyOptions} options 
 * 
 * @returns {Function} Oak proxy middleware
 * @public
 */
export function proxy(
  url: string | URL | ProxyUrlFunction,
  options: ProxyOptions = {},
) {
  return async function handleProxy(
    ctx: any,
    next: any,
  ) {
    const state = createState(ctx.request, ctx.response, next, url, options);

    await filterSrcReq(state)
      .then(buildProxyUrl(ctx))
      .then(decorateProxyReqUrl)
      .then(buildProxyReqInit)
      .then(decorateProxyReqInit)
      .then(prepareProxyReq)
      .then(sendProxyReq)
      .then(filterProxyRes)
      .then(copyProxyResHeadersToUserRes)
      .then(decorateSrcResHeaders)
      .then(decorateSrcRes)
      .then(sendSrcRes)
      .catch((err) => {
        if (err) {
          const resolver = (state.options.proxyErrorHandler)
            ? state.options.proxyErrorHandler
            : handleProxyErrors;

          resolver(err, ctx, next);
        } else {
          return next();
        }
      });
  };
}
