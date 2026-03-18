import { handleCors } from "../_shared/cors.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";

Deno.serve((request) => {
  const cors = handleCors(request);

  if (cors) {
    return cors;
  }

  try {
    return jsonResponse({
      ok: true,
      service: "health",
    });
  } catch (error) {
    return errorResponse(error);
  }
});
