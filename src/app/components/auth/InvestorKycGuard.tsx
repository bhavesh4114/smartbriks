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
  const user = getEffectiveInvestorUser();

  if (user?.role && user.role !== "investor") return null;

  return <Component />;
}
