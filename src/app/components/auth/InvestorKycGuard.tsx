import { Navigate } from "react-router";
import { getEffectiveInvestorUser } from "../../config/kyc";

const INVESTOR_KYC_PATH = "/investor/kyc";

/**
 * Route guard for investor dashboard routes.
 * Redirects to KYC form only when KYC is not_started or in_progress.
 * Allows dashboard for pending and approved.
 */
export function InvestorKycGuard({
  Component,
}: {
  Component: React.ComponentType;
}) {
  const user = getEffectiveInvestorUser();

  if (
    user?.role === "investor" &&
    (user?.kycStatus === "not_started" || user?.kycStatus === "in_progress")
  ) {
    return <Navigate to={INVESTOR_KYC_PATH} replace />;
  }

  return <Component />;
}
