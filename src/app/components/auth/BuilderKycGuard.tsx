import { Navigate } from "react-router";
import { getEffectiveBuilderUser } from "../../config/builderKyc";

const BUILDER_KYC_PATH = "/builder/kyc";

/**
 * Route guard for builder dashboard routes.
 * Redirects to KYC form when KYC is not_started or in_progress.
 */
export function BuilderKycGuard({
  Component,
}: {
  Component: React.ComponentType;
}) {
  const user = getEffectiveBuilderUser();

  if (
    user?.role === "builder" &&
    (user?.kycStatus === "not_started" || user?.kycStatus === "in_progress")
  ) {
    return <Navigate to={BUILDER_KYC_PATH} replace />;
  }

  return <Component />;
}
