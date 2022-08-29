import type { ProxyOptions as BaseProxyOptions } from "../deps.ts";

export interface ProxyOptions extends BaseProxyOptions {
  /**
   * The request body size limit to use.
   *
   * @public
   */
  reqBodyLimit?: number;
}
