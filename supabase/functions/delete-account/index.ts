import { requireAuthenticatedProfile } from "../_shared/auth.ts";
import { handleCors } from "../_shared/cors.ts";
import { errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";

Deno.serve(async (request) => {
  const cors = handleCors(request);

  if (cors) {
    return cors;
  }

  try {
    if (request.method !== "POST") {
      throw new HttpError(405, "Method not allowed.");
    }

    const { service, user } = await requireAuthenticatedProfile(request);
    const { error } = await service.auth.admin.deleteUser(user.id);

    if (error) {
      throw new HttpError(500, "Couldn't delete the account.", error.message);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
});
