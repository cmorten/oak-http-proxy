/**
 * Run this example using:
 *
 *    deno run --allow-net ./examples/basic/index.ts
 *
 *    if have the repo cloned locally OR
 *
 *    deno run --allow-net https://deno.land/x/oak_http_proxy@2.3.0/examples/basic/index.ts
 *
 *    if you don't!
 */

import { proxy } from "../../mod.ts";
import { Application } from "https://deno.land/x/oak@v12.6.2/mod.ts";

const app = new Application();

app.addEventListener("error", (event) => {
  console.log(event.error);
});

app.use(proxy("https://github.com/oakserver/oak"));

await app.listen({ port: 3000 });
