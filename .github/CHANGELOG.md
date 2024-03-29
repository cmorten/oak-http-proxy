# ChangeLog

For the latest changes, please refer to the
[releases page](https://github.com/cmorten/oak-http-proxy/releases).

## [2.1.0] - 29-08-2022

- feat: support Deno `1.25.0` and std `0.153.0`
- feat: upgrade to `opineHttpProxy@3.0.2`
- feat: other minor dependency upgrades
- feat: add `reqBodyLimit` for changing request body size limits

## [2.0.1] - 10-01-2022

- feat: support Deno `1.17.2` and std `0.120.0`
- feat: upgrade to `opineHttpProxy@3.0.1`
- feat: other minor dependency upgrades

## [2.0.0] - 21-11-2021

- feat: support Deno `1.16.2` and std `0.115.1`
- feat: upgrade to `opineHttpProxy@3.0.0`
- fix: usage of `ctx.throw()` in error scenarios
- fix: don't send body if have null body status
- feat: upgrade to opine, oak, and superdeno deps
- test: set content-length header when make POST requests to an oak server in tests following body size limits protection

## [1.4.1] - 13-07-2021

- fix: filterReq crashes send middleware (#3)

## [1.4.0] - 13-07-2021

- feat: Support Deno `1.12.0` and std `0.101.0`

## [1.3.0] - 26-04-2021

- feat: Support Deno `1.9.2` and std `0.95.0`

## [1.2.0] - 10-02-2021

- feat: Support Deno 1.7.2 and std 0.85.0

## [1.1.1] - 19-09-2020

- chore: upgrade to eggs@0.2.2 in CI

## [1.1.0] - 19-09-2020

- feat: Support Deno 1.4.1 and std 0.70.0

## [1.0.3] - 26-08-2020

- fix: deno.land/x registry no longer supports mixed case.

## [1.0.2] - 26-08-2020

- fix: use supported module name format for deno.land/x registry.

## [1.0.1] - 26-08-2020

- docs: readme typo for nest.land.

## [1.0.0] - 26-08-2020

- feat: initial loose port of [opine-http-proxy](https://github.com/cmorten/opine-http-proxy).
