import type { ProxyState } from "../../deps.ts";

const defaultFilter = () => false;

export function filterSrcReq(state: ProxyState) {
  const resolverFn = state.options.filterReq || defaultFilter;

  return Promise
    .resolve(resolverFn(state.src.req, state.src.res))
    .then((isFiltered) => !isFiltered ? state : Promise.reject());
}
