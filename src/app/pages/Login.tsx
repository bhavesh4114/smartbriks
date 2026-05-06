import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Label } from "../components/ui/label";
import { SiteHeader } from "../components/layout/SiteHeader";
import { SiteFooter } from "../components/layout/SiteFooter";
import { getKycStatus, setKycStatus, setInvestorUser } from "../config/kyc";
import { getBuilderKycStatus, setBuilderUser, setBuilderKycStatus } from "../config/builderKyc";

const GOOGLE_ICON = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const LINKEDIN_ICON = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=1400&fit=crop";

// Use relative URL in dev (Vite proxies /api to backend); set VITE_API_URL in production if needed
const env = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env;
const API_BASE = env?.VITE_API_URL ?? "";
const formStagger = { delay: 0.08, duration: 0.4 };

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"investor" | "builder">("investor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setLoginError(data.message || "Invalid credentials");
        } else if (res.status === 404) {
          setLoginError("Login service not found. Ensure the backend is running on port 4000.");
        } else {
          setLoginError(data.message || "Login failed. Please try again.");
        }
        return;
      }

      if (!data.success || !data.token) {
        setLoginError("Login failed. Please try again.");
        return;
      }
      const role = (data.user?.role ?? data.data?.role) as string;
      if (!role) {
        setLoginError("Login failed. Please try again.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", role);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      else if (data.data) {
        const u = data.data;
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: u.id,
            role: u.role,
            fullName: u.fullName ?? (u.role === "INVESTOR" ? u.contactPerson : undefined),
            companyName: u.companyName,
          })
        );
      }

      if (role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      if (role === "BUILDER" || role === "builder") {
        const raw = data.user?.kycStatus ?? data.data?.kycStatus;
        const kycStatus =
          raw === "VERIFIED" ? "approved" : raw === "REJECTED" ? "rejected" : raw === "PENDING" ? "pending" : getBuilderKycStatus();
        setBuilderUser({ role: "builder", kycStatus });
        setBuilderKycStatus(kycStatus);
        navigate("/builder/dashboard", { replace: true });
        return;
      }

      if (role === "INVESTOR") {
        const raw = data.user?.kycStatus ?? data.data?.kycStatus;
        const kycStatus =
          raw === "VERIFIED" ? "approved" : raw === "REJECTED" ? "rejected" : raw === "PENDING" ? "pending" : getKycStatus();
        setInvestorUser({ role: "investor", kycStatus });
        setKycStatus(kycStatus);
        navigate("/investor/dashboard", { replace: true });
        return;
      }

      setLoginError("Unknown role. Please try again.");
    } catch {
      setLoginError("Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    "w-full min-h-[48px] rounded-xl border border-gray-200/80 bg-white/70 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/25 focus:bg-white/90";

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-white font-sans antialiased">
      <SiteHeader />
      <main className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Left: Background + welcome (desktop) */}
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative hidden min-h-0 flex-1 flex-col justify-between md:flex md:w-1/2 lg:min-w-0"
        >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/88 to-slate-800/95" />
        <div className="relative z-10 flex flex-col justify-between p-6 md:p-10 lg:p-12">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2.5 text-white transition-opacity hover:opacity-90"
            aria-label="SmartBrick home"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">SmartBrick</span>
          </Link>
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl font-bold leading-tight text-white md:text-5xl"
            >
              Welcome Back to SmartBrick
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-4 max-w-sm text-lg text-slate-300"
            >
              Securely access your real estate investments
            </motion.p>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} SmartBrick
          </p>
        </div>
        </motion.aside>

        {/* Right: Login form */}
        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900 px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-12 lg:px-16 lg:py-16">
        {/* Mobile: logo at top */}
        <Link
          to="/"
          className="absolute left-4 top-6 z-10 inline-flex shrink-0 items-center gap-2.5 text-white md:hidden"
          aria-label="SmartBrick home"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white sm:h-10 sm:w-10">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight sm:text-xl">SmartBrick</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 w-full min-w-0 max-w-full shrink-0 rounded-2xl border border-white/20 bg-white/15 pt-3 px-4 pb-4 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:mt-0 sm:max-w-[420px] sm:p-6 md:bg-white/10 md:border-white/15 md:p-8"
        >
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-xl font-bold tracking-tight text-white sm:text-2xl"
          >
            Welcome Back
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4 }}
            className="mt-2 text-slate-400"
          >
            Enter your credentials to access your portfolio
          </motion.p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: formStagger.duration }}
              className="flex rounded-xl bg-white/5 p-1 backdrop-blur-sm"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === "investor"}
                onClick={() => setSelectedRole("investor")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                  selectedRole === "investor"
                    ? "bg-[#2563eb] text-white shadow-lg shadow-[#2563eb]/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Investor
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === "builder"}
                onClick={() => setSelectedRole("builder")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                  selectedRole === "builder"
                    ? "bg-[#2563eb] text-white shadow-lg shadow-[#2563eb]/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Builder
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: formStagger.duration }}
              className="space-y-2"
            >
              <Label htmlFor="email" className="text-sm font-medium text-slate-200">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setLoginError(""); }}
                  required
                  className={inputBase}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.44, duration: formStagger.duration }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-200">
                  Password
                </Label>
                <Link
                  to="#"
                  className="text-sm font-medium text-[#60a5fa] transition-colors hover:text-[#93c5fd]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                  required
                  className={`${inputBase} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52, duration: formStagger.duration }}
              className="flex items-center gap-3"
            >
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="h-4 w-4 rounded border-slate-500 bg-white/5 text-[#2563eb] transition-colors focus:ring-2 focus:ring-[#2563eb]/30 focus:ring-offset-0 focus:ring-offset-transparent"
              />
              <Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-slate-400">
                Remember me
              </Label>
            </motion.div>

            {loginError && (
              <p className="text-sm text-red-400" role="alert">
                {loginError}
              </p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: formStagger.duration }}
            >
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={!submitting ? { scale: 1.05 } : undefined}
                whileTap={!submitting ? { scale: 0.95 } : undefined}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="w-full min-h-[48px] rounded-xl bg-[#2563eb] py-3.5 text-base font-semibold text-white shadow-lg shadow-[#2563eb]/30 transition-colors hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Logging in…" : "Login"}
              </motion.button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.68, duration: 0.4 }}
            className="mt-8"
          >
            <div className="relative flex h-10 items-center justify-center">
              <div className="absolute inset-0 top-1/2 border-b border-white/10" aria-hidden />
              <span className="relative z-10 bg-transparent px-4 text-sm font-medium text-slate-500">
                Or continue with
              </span>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <motion.a
                href="#"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-200 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
              >
                {GOOGLE_ICON}
                Google
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-200 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
              >
                {LINKEDIN_ICON}
                LinkedIn
              </motion.a>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.72, duration: 0.4 }}
            className="mt-8 text-center text-sm text-slate-500"
          >
            New to SmartBrick?{" "}
            <Link
              to="/investor/signup"
              className="font-semibold text-[#60a5fa] transition-colors hover:text-[#93c5fd]"
            >
              Create an account
            </Link>
          </motion.p>
        </motion.div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
