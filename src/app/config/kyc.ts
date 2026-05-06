/** KYC status values for investor flow */
export type KycStatus =
  | "not_started"
  | "in_progress"
  | "pending"
  | "approved"
  | "rejected";

export const KYC_STATUS_KEY = "investor_kyc_status";
export const KYC_REJECTION_REASON_KEY = "investor_kyc_rejection_reason";

const DEFAULT_STATUS: KycStatus = "not_started";

export function getKycStatus(): KycStatus {
  const raw = localStorage.getItem(KYC_STATUS_KEY);
  if (!raw) return DEFAULT_STATUS;
  const status = raw as KycStatus;
  if (["not_started", "in_progress", "pending", "approved", "rejected"].includes(status))
    return status;
  return DEFAULT_STATUS;
}

export function setKycStatus(status: KycStatus): void {
  localStorage.setItem(KYC_STATUS_KEY, status);
}

export function getKycRejectionReason(): string {
  return localStorage.getItem(KYC_REJECTION_REASON_KEY) ?? "";
}

export function setKycRejectionReason(reason: string): void {
  if (reason) localStorage.setItem(KYC_REJECTION_REASON_KEY, reason);
  else localStorage.removeItem(KYC_REJECTION_REASON_KEY);
}

export function isKycApproved(): boolean {
  return getKycStatus() === "approved";
}

/** Persisted investor user (role + kycStatus) for guards and status page. Refresh-safe. */
export const INVESTOR_USER_KEY = "investor_user";

export type InvestorUser = { role: "investor"; kycStatus: KycStatus };

export function getInvestorUser(): InvestorUser | null {
  const raw = localStorage.getItem(INVESTOR_USER_KEY);
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as InvestorUser;
    if (u?.role === "investor" && u?.kycStatus) return u;
  } catch (_) {}
  return null;
}

export function setInvestorUser(user: InvestorUser): void {
  localStorage.setItem(INVESTOR_USER_KEY, JSON.stringify(user));
}

/** Update both persisted user and kyc status so status page and guards stay in sync. */
export function syncInvestorUserKycStatus(kycStatus: KycStatus): void {
  setInvestorUser({ role: "investor", kycStatus });
  setKycStatus(kycStatus);
}

/** User for status page / guards; falls back to kyc status from localStorage when user record missing. */
export function getEffectiveInvestorUser(): InvestorUser {
  const u = getInvestorUser();
  if (u) return u;
  return { role: "investor", kycStatus: getKycStatus() };
}
