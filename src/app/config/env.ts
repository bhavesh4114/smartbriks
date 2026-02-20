/**
 * App environment. Use VITE_APP_ENV=dev | prod (or leave unset for production-safe default).
 * DEV: enables auto-approve KYC for testing. Never enable in production.
 */
const raw = typeof import.meta !== "undefined" && (import.meta as { env?: { VITE_APP_ENV?: string } }).env?.VITE_APP_ENV;

export const APP_ENV = raw === "dev" ? "dev" : "prod";

export function isAppEnvDev(): boolean {
  return APP_ENV === "dev";
}
