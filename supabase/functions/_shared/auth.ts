import { createServiceClient, createUserClient } from "./supabase.ts";
import { HttpError } from "./http.ts";

export async function requireAuthenticatedProfile(request: Request) {
  const authorization = request.headers.get("Authorization");

  if (!authorization) {
    throw new HttpError(401, "Missing Authorization header.");
  }

  const userClient = createUserClient(authorization);
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    throw new HttpError(401, "Invalid or expired session.");
  }

  const service = createServiceClient();
  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new HttpError(404, "Profile not found.");
  }

  return {
    profile,
    service,
    user,
    userClient,
  };
}

export async function requireAdminProfile(request: Request) {
  const context = await requireAuthenticatedProfile(request);

  if (context.profile.role !== "admin") {
    throw new HttpError(403, "Admin access is required.");
  }

  return context;
}
