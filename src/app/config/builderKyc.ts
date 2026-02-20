/** KYC status values for builder flow */
export type BuilderKycStatus =
  | "not_started"
  | "in_progress"
  | "pending"
  | "approved"
  | "rejected";

export const BUILDER_KYC_STATUS_KEY = "builder_kyc_status";
export const BUILDER_KYC_REJECTION_REASON_KEY = "builder_kyc_rejection_reason";

const DEFAULT_STATUS: BuilderKycStatus = "not_started";

export function getBuilderKycStatus(): BuilderKycStatus {
  const raw = localStorage.getItem(BUILDER_KYC_STATUS_KEY);
  if (!raw) return DEFAULT_STATUS;
  const status = raw as BuilderKycStatus;
  if (["not_started", "in_progress", "pending", "approved", "rejected"].includes(status))
    return status;
  return DEFAULT_STATUS;
}

export function setBuilderKycStatus(status: BuilderKycStatus): void {
  localStorage.setItem(BUILDER_KYC_STATUS_KEY, status);
}

export function getBuilderKycRejectionReason(): string {
  return localStorage.getItem(BUILDER_KYC_REJECTION_REASON_KEY) ?? "";
}

export function setBuilderKycRejectionReason(reason: string): void {
  if (reason) localStorage.setItem(BUILDER_KYC_REJECTION_REASON_KEY, reason);
  else localStorage.removeItem(BUILDER_KYC_REJECTION_REASON_KEY);
}

export function isBuilderKycApproved(): boolean {
  return getBuilderKycStatus() === "approved";
}

/** Persisted builder user (role + kycStatus) for guards and status page. */
export const BUILDER_USER_KEY = "builder_user";

export type BuilderUser = { role: "builder"; kycStatus: BuilderKycStatus };

export function getBuilderUser(): BuilderUser | null {
  const raw = localStorage.getItem(BUILDER_USER_KEY);
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as BuilderUser;
    if (u?.role === "builder" && u?.kycStatus) return u;
  } catch (_) {}
  return null;
}

export function setBuilderUser(user: BuilderUser): void {
  localStorage.setItem(BUILDER_USER_KEY, JSON.stringify(user));
}

/** Update both persisted user and KYC status so status page and guards stay in sync. */
export function syncBuilderKycStatus(kycStatus: BuilderKycStatus): void {
  setBuilderUser({ role: "builder", kycStatus });
  setBuilderKycStatus(kycStatus);
}

export function getEffectiveBuilderUser(): BuilderUser {
  const u = getBuilderUser();
  if (u) return u;
  return { role: "builder", kycStatus: getBuilderKycStatus() };
}
