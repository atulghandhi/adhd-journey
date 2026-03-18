import { corsHeaders } from "./cors.ts";

export class HttpError extends Error {
  details?: unknown;
  status: number;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return jsonResponse(
      {
        details: error.details ?? null,
        error: error.message,
      },
      error.status,
    );
  }

  console.error(
    "[edge-function-error]",
    error instanceof Error ? error.message : String(error),
  );

  return jsonResponse(
    {
      error: "Something went wrong.",
    },
    500,
  );
}
