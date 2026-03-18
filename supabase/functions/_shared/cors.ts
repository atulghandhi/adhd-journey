export const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Origin": "*",
} as const;

export function handleCors(request: Request) {
  if (request.method !== "OPTIONS") {
    return null;
  }

  return new Response("ok", {
    headers: corsHeaders,
    status: 200,
  });
}
