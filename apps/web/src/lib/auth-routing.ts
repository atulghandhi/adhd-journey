export function getProtectedWebRedirect(userId?: string | null) {
  return userId ? null : "/auth/login";
}
