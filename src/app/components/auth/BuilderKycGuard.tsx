import { getEffectiveBuilderUser } from "../../config/builderKyc";
import { Navigate, useLocation } from "react-router";

export function BuilderKycGuard({
  Component,
}: {
  Component: React.ComponentType;
}) {
  const location = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const storedRole = (typeof window !== "undefined" ? localStorage.getItem("userRole") : null)?.toUpperCase();
  const user = getEffectiveBuilderUser();

  if (!token) return <Navigate to="/builder/login" replace />;
  if (!storedRole) return <Navigate to="/builder/login" replace />;

  if (storedRole && storedRole !== "BUILDER") {
    if (storedRole === "INVESTOR") return <Navigate to="/investor/dashboard" replace />;
    if (storedRole === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  if (user?.role && user.role !== "builder") return <Navigate to="/login" replace />;
  if (
    user.kycStatus !== "approved" &&
    location.pathname !== "/builder/dashboard" &&
    location.pathname !== "/builder/logout"
  ) {
    return <Navigate to="/builder/dashboard" replace />;
  }

  return <Component />;
}
