import { Navigate } from "react-router";

const TOKEN_KEY = "token";
const USER_ROLE_KEY = "userRole";

/**
 * Protects admin routes: requires valid JWT and role === ADMIN.
 * If not authenticated or not admin, redirects to /login.
 */
export function AdminGuard({ Component }: { Component: React.ComponentType }) {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const role = typeof window !== "undefined" ? localStorage.getItem(USER_ROLE_KEY) : null;

  if (!token || role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  return <Component />;
}
