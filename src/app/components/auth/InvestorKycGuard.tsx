import { Navigate } from "react-router";
import { getEffectiveInvestorUser } from "../../config/kyc";

/**
 * Route guard for investor routes.
 * It only validates role context and intentionally avoids KYC redirects so
 * Investor users always reach dashboard first after login.
 */
export function InvestorKycGuard({
  Component,
}: {
  Component: React.ComponentType;
}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const storedRole = (typeof window !== "undefined" ? localStorage.getItem("userRole") : null)?.toUpperCase();
  const user = getEffectiveInvestorUser();

  if (!token) {
    return <Navigate to="/investor/login" replace />;
  }

  if (storedRole && storedRole !== "INVESTOR") {
    if (storedRole === "BUILDER") return <Navigate to="/builder/dashboard" replace />;
    if (storedRole === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  if (user?.role && user.role !== "investor") {
    return <Navigate to="/login" replace />;
  }

  return <Component />;
}
