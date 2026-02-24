import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, Clock } from "lucide-react";
import {
  getEffectiveBuilderUser,
  getBuilderKycRejectionReason,
  setBuilderKycRejectionReason,
  type BuilderUser,
} from "../../config/builderKyc";
import { SiteHeader } from "../../components/layout/SiteHeader";
import { SiteFooter } from "../../components/layout/SiteFooter";

export default function BuilderKycStatus() {
  const navigate = useNavigate();
  const [user, setUser] = useState<BuilderUser>(() => getEffectiveBuilderUser());

  useEffect(() => {
    if (user?.role === "builder" && user?.kycStatus === "approved") {
      navigate("/builder/dashboard", { replace: true });
    }
  }, [user?.kycStatus, navigate]);

  useEffect(() => {
    setUser(getEffectiveBuilderUser());
  }, []);

  useEffect(() => {
    const sync = () => setUser(getEffectiveBuilderUser());
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    fetch("/api/builder/kyc/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.kycStatus) {
          const raw = data.kycStatus as string;
          const mapped =
            raw === "VERIFIED"
              ? "approved"
              : raw === "REJECTED"
              ? "rejected"
              : raw === "PENDING"
              ? "pending"
              : user.kycStatus;
          if (typeof data.rejectionReason === "string") {
            setBuilderKycRejectionReason(data.rejectionReason);
          }
          if (mapped !== user.kycStatus) {
            // Persist for guards/dashboard via localStorage-backed helpers
            import("../../config/builderKyc").then(({ syncBuilderKycStatus }) => {
              syncBuilderKycStatus(mapped);
              setUser(getEffectiveBuilderUser());
            });
          }
        }
      })
      .catch(() => {});
  }, [user.kycStatus]);

  useEffect(() => {
    if (user.role !== "builder") return;
    if (user.kycStatus === "not_started" || user.kycStatus === "in_progress") {
      navigate("/builder/kyc", { replace: true });
      return;
    }
  }, [user.kycStatus, user.role, navigate]);

  const handleResubmit = () => {
    setBuilderKycRejectionReason("");
    navigate("/builder/kyc", { replace: true });
  };

  const status = user.kycStatus;
  if (status === "not_started" || status === "in_progress" || status === "approved") {
    return null;
  }

  return (
    <>
      <SiteHeader authenticated />
      <main className="pt-16 bg-[#F8FAFC]">
        <div className="min-w-0 px-4 py-8">
          <div className="mx-auto min-w-0 max-w-[900px]">
            <div
              className="rounded-2xl bg-white p-6 shadow-sm border border-[#E5E7EB] sm:p-8"
              style={{ color: "#111827" }}
            >
              {status === "pending" && (
                <>
                  <PendingView />
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => navigate("/builder/dashboard", { replace: true })}
                      className="rounded-xl py-3.5 px-6 text-base font-semibold text-white bg-[#2563EB] hover:bg-[#1E40AF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
                    >
                      Go to Builder Dashboard
                    </button>
                  </div>
                </>
              )}
              {status === "rejected" && <RejectedView onResubmit={handleResubmit} />}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function PendingView() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
        <Clock className="h-7 w-7 text-[#2563EB]" aria-hidden />
      </div>
      <h2 className="text-xl font-semibold text-[#111827]">
        Builder KYC Under Review
      </h2>
      <p className="mt-3 max-w-md text-sm font-medium text-[#111827]">
        Your builder KYC has been submitted successfully.
      </p>
      <p className="mt-2 max-w-md text-sm text-[#6B7280]">
        Our team will review it within 24–48 hours.
      </p>
      <p className="mt-2 text-sm text-[#6B7280]">
        We will notify you once the verification is complete.
      </p>
    </div>
  );
}

function RejectedView({ onResubmit }: { onResubmit: () => void }) {
  const reason = getBuilderKycRejectionReason();

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-7 w-7 text-[#DC2626]" aria-hidden />
      </div>
      <h2 className="text-xl font-semibold text-[#111827]">
        Builder KYC Not Approved
      </h2>
      {reason && (
        <p className="mt-3 max-w-md rounded-xl border border-[#E5E7EB] px-4 py-3 text-left text-sm text-[#374151]">
          {reason}
        </p>
      )}
      <button
        type="button"
        onClick={onResubmit}
        className="mt-6 rounded-xl py-3.5 px-6 text-base font-semibold text-white bg-[#2563EB] hover:bg-[#1E40AF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
      >
        Re-submit KYC
      </button>
    </div>
  );
}
