import { getEffectiveBuilderUser } from "../../config/builderKyc";

/**
 * Route guard for builder routes.
 * It preserves builder-only access context and intentionally avoids KYC
 * redirects so dashboard is always reachable post-login.
 */
export function BuilderKycGuard({
  Component,
}: {
  Component: React.ComponentType;
}) {
  const user = getEffectiveBuilderUser();

  if (user?.role && user.role !== "builder") return null;

  return <Component />;
}
