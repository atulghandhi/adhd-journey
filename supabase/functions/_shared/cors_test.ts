import { assertEquals } from "jsr:@std/assert";
import { corsHeaders, handleCors } from "./cors.ts";

Deno.test("handleCors returns null for non-OPTIONS requests", () => {
  const request = new Request("http://localhost", { method: "GET" });

  assertEquals(handleCors(request), null);
});

Deno.test("handleCors returns null for POST requests", () => {
  const request = new Request("http://localhost", { method: "POST" });

  assertEquals(handleCors(request), null);
});

Deno.test("handleCors returns 200 with CORS headers for OPTIONS", async () => {
  const request = new Request("http://localhost", { method: "OPTIONS" });
  const response = handleCors(request);

  assertEquals(response?.status, 200);
  assertEquals(
    response?.headers.get("Access-Control-Allow-Origin"),
    corsHeaders["Access-Control-Allow-Origin"],
  );
  assertEquals(await response?.text(), "ok");
});

Deno.test("corsHeaders includes required headers", () => {
  assertEquals(typeof corsHeaders["Access-Control-Allow-Headers"], "string");
  assertEquals(typeof corsHeaders["Access-Control-Allow-Methods"], "string");
  assertEquals(corsHeaders["Access-Control-Allow-Origin"], "*");
});
