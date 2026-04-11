import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { errorResponse, HttpError, jsonResponse } from "./http.ts";

Deno.test("jsonResponse returns JSON with correct headers", async () => {
  const response = jsonResponse({ ok: true });

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Content-Type"), "application/json");

  const body = await response.json();
  assertEquals(body.ok, true);
});

Deno.test("jsonResponse supports custom status code", () => {
  const response = jsonResponse({ created: true }, 201);

  assertEquals(response.status, 201);
});

Deno.test("HttpError stores status and message", () => {
  const error = new HttpError(404, "Not found");

  assertEquals(error.status, 404);
  assertEquals(error.message, "Not found");
  assertEquals(error.name, "HttpError");
});

Deno.test("HttpError stores optional details", () => {
  const error = new HttpError(400, "Bad request", { field: "email" });

  assertEquals(error.details, { field: "email" });
});

Deno.test("errorResponse returns structured error for HttpError", async () => {
  const error = new HttpError(422, "Invalid input", { field: "rating" });
  const response = errorResponse(error);

  assertEquals(response.status, 422);

  const body = await response.json();
  assertEquals(body.error, "Invalid input");
  assertEquals(body.details.field, "rating");
});

Deno.test("errorResponse returns 500 for generic errors", async () => {
  const response = errorResponse(new Error("unexpected"));

  assertEquals(response.status, 500);

  const body = await response.json();
  assertEquals(body.error, "Something went wrong.");
});

Deno.test("errorResponse returns 500 for non-Error values", async () => {
  const response = errorResponse("string error");

  assertEquals(response.status, 500);

  const body = await response.json();
  assertEquals(body.error, "Something went wrong.");
});
