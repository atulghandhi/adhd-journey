import { handleCors } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";

function resolvePaymentStatus(payload: Record<string, unknown>) {
  const directStatus = payload.payment_status;

  if (directStatus === "paid" || directStatus === "free") {
    return directStatus;
  }

  const event =
    payload.event && typeof payload.event === "object"
      ? (payload.event as Record<string, unknown>)
      : null;
  const eventType = typeof event?.type === "string" ? event.type : null;

  if (
    eventType === "INITIAL_PURCHASE" ||
    eventType === "NON_RENEWING_PURCHASE" ||
    eventType === "RENEWAL" ||
    payload.entitlement_active === true
  ) {
    return "paid";
  }

  if (
    eventType === "CANCELLATION" ||
    eventType === "EXPIRATION" ||
    eventType === "BILLING_ISSUE"
  ) {
    return "free";
  }

  return "paid";
}

function resolveUserId(payload: Record<string, unknown>) {
  if (typeof payload.userId === "string") {
    return payload.userId;
  }

  const event =
    payload.event && typeof payload.event === "object"
      ? (payload.event as Record<string, unknown>)
      : null;

  if (typeof event?.app_user_id === "string") {
    return event.app_user_id;
  }

  if (typeof event?.original_app_user_id === "string") {
    return event.original_app_user_id;
  }

  return null;
}

Deno.serve(async (request) => {
  const cors = handleCors(request);

  if (cors) {
    return cors;
  }

  try {
    const payload =
      request.method === "POST"
        ? ((await request.json()) as Record<string, unknown>)
        : {};
    const userId = resolveUserId(payload);

    if (!userId) {
      throw new HttpError(400, "A user id is required.");
    }

    const paymentStatus = resolvePaymentStatus(payload);
    const service = createServiceClient();
    const { error } = await service
      .from("profiles")
      .update({
        payment_receipt: payload,
        payment_status: paymentStatus,
      })
      .eq("id", userId);

    if (error) {
      throw error;
    }

    return jsonResponse({
      ok: true,
      paymentStatus,
      userId,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
