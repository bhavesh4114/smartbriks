import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { AlertCircle, Clock, Shield, RefreshCw } from "lucide-react";
import {
  getEffectiveInvestorUser,
  getKycRejectionReason,
  setKycStatus,
  setKycRejectionReason,
  syncInvestorUserKycStatus,
  type InvestorUser,
} from "../../config/kyc";
import { SiteHeader } from "../../components/layout/SiteHeader";
import { SiteFooter } from "../../components/layout/SiteFooter";

const HERO_BG =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80";

export default function InvestorKycStatus() {
  const navigate = useNavigate();
  const [user, setUser] = useState<InvestorUser>(() => getEffectiveInvestorUser());

  useEffect(() => {
    if (user?.role === "investor" && user?.kycStatus === "approved") {
      navigate("/investor/dashboard");
    }
  }, [user?.kycStatus, navigate]);

  useEffect(() => {
    setUser(getEffectiveInvestorUser());
  }, []);

  useEffect(() => {
    const sync = () => setUser(getEffectiveInvestorUser());
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  useEffect(() => {
    if (user?.role !== "investor") return;
    if (user?.kycStatus === "not_started" || user?.kycStatus === "in_progress") {
      navigate("/investor/kyc", { replace: true });
      return;
    }
  }, [user?.kycStatus, user?.role, navigate]);

  const handleResubmit = () => {
    setKycStatus("in_progress");
    setKycRejectionReason("");
    navigate("/investor/kyc", { replace: true });
  };

  const fetchAndSyncStatus = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    fetch("/api/investor/kyc/status", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.kycStatus) {
          const raw = data.kycStatus;
          const mapped =
            raw === "VERIFIED" ? "approved" : raw === "REJECTED" ? "rejected" : raw === "PENDING" ? "pending" : user?.kycStatus ?? "pending";
          syncInvestorUserKycStatus(mapped);
          setUser(getEffectiveInvestorUser());
        }
      })
      .catch(() => {});
  };

  const status = user?.kycStatus;
  if (!status || status === "not_started" || status === "in_progress" || status === "approved") {
    return null;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <SiteHeader authenticated />
      <main className="relative min-h-screen pt-16">
        {/* Full-screen background + gradient overlay */}
        <div className="fixed inset-0 -z-10">
          <img
            src={HERO_BG}
            alt=""
            className="h-full w-full object-cover blur-[2px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-slate-900/75 to-blue-900/60" />
        </div>

        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full min-w-0 max-w-[700px] overflow-visible rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8 md:p-10"
          >
            {status === "pending" && (
              <>
                <PendingView onRefresh={fetchAndSyncStatus} />
                {user.role === "investor" && (
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={fetchAndSyncStatus}
                      className="rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white/10"
                    >
                      <RefreshCw className="mr-2 inline-block h-4 w-4" aria-hidden />
                      Refresh status
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate("/investor/dashboard", { replace: true })}
                      className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/40 transition-colors hover:from-blue-600 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white/10"
                    >
                      Go to Dashboard
                    </motion.button>
                  </div>
                )}
              </>
            )}
            {status === "rejected" && <RejectedView onResubmit={handleResubmit} />}

            {/* Trust note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
            >
              <Shield className="h-4 w-4 text-blue-300" aria-hidden />
              <span>Your data is securely encrypted and compliant with regulations.</span>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function PendingView({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-blue-500/20 shadow-lg shadow-blue-500/20"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Clock className="h-9 w-9 text-blue-300" aria-hidden />
        </motion.div>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
      >
        Your KYC verification is in progress
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mt-3 max-w-md text-base text-white/80"
      >
        Your KYC has been submitted successfully.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="mt-2 text-sm font-medium text-blue-200"
      >
        Usually takes 24–48 hours
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mt-2 max-w-md text-sm font-medium text-blue-200"
      >
        Wait for admin approval. Once approved, your dashboard will show approved status.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="mt-1 max-w-md text-sm text-white/60"
      >
        We will notify you once the verification is complete.
      </motion.p>
    </div>
  );
}

function RejectedView({ onResubmit }: { onResubmit: () => void }) {
  const reason = getKycRejectionReason();

  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-red-400/30 bg-red-500/20 shadow-lg shadow-red-500/20"
      >
        <AlertCircle className="h-10 w-10 text-red-300" aria-hidden />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
      >
        KYC Rejected
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-3 max-w-md text-sm text-white/70"
      >
        Please re-submit required details to continue.
      </motion.p>
      {reason && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-4 w-full max-w-md rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-left text-sm text-red-100"
        >
          <span className="font-medium text-red-200">Reason: </span>
          {reason}
        </motion.div>
      )}
      <div className="mt-8 flex justify-center">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onResubmit}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/40 transition-colors hover:from-blue-600 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white/10"
        >
          Re-submit KYC
        </motion.button>
      </div>
    </div>
  );
}
