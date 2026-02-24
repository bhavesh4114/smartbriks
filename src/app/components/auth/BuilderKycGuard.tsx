import { getEffectiveBuilderUser } from "../../config/builderKyc";
import { Navigate, useLocation } from "react-router";

export function BuilderKycGuard({
  Component,
}: {
  Component: React.ComponentType;
}) {
  const location = useLocation();
  const user = getEffectiveBuilderUser();

  if (user?.role && user.role !== "builder") return null;
  if (
    user.kycStatus !== "approved" &&
    location.pathname !== "/builder/dashboard" &&
    location.pathname !== "/builder/logout"
  ) {
    return <Navigate to="/builder/dashboard" replace />;
  }

  return <Component />;
}
