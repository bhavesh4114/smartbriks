import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Shield, Calendar, Lock, Check, Eye, EyeOff, Info, Camera, Upload, ChevronRight } from "lucide-react";
import { getKycStatus, setKycStatus, syncInvestorUserKycStatus } from "../../config/kyc";
import { Label } from "../../components/ui/label";
import { Dropdown } from "../../components/ui/dropdown";
import { SiteHeader } from "../../components/layout/SiteHeader";
import { SiteFooter } from "../../components/layout/SiteFooter";

const STEPS = [
  "Personal",
  "Address",
  "Bank Info",
  "Income",
  "Selfie",
  "Review",
];

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AADHAAR_REGEX = /^\d{12}$/;
const PINCODE_REGEX = /^\d{6}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
];

function maskPan(pan: string): string {
  const s = pan.replace(/\s/g, "");
  if (s.length < 4) return "*****";
  return s.slice(0, 2) + "***" + s.slice(-2);
}
function maskAadhaar(aadhaar: string): string {
  const d = aadhaar.replace(/\D/g, "");
  if (d.length < 4) return "**** **** ****";
  return "**** **** " + d.slice(-4);
}
function maskAccountLast4(account: string): string {
  const d = account.replace(/\D/g, "");
  if (d.length < 4) return "****";
  return d.slice(-4);
}

const ANNUAL_INCOME_LABELS: Record<string, string> = {
  below_5: "Below ₹5 Lakhs",
  "5_10": "₹5–10 Lakhs",
  "10_25": "₹10–25 Lakhs",
  above_25: "Above ₹25 Lakhs",
};
const OCCUPATION_LABELS: Record<string, string> = {
  salaried: "Salaried",
  self_employed: "Self-Employed",
  business_owner: "Business Owner",
  retired: "Retired",
  other: "Other",
};
const RISK_APPETITE_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function InvestorKyc() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [kycData, setKycData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    dateOfBirth: "",
    gender: "",
    pan: "",
    aadhaar: "",
    // Step 2 – Address
    resAddressLine1: "",
    resAddressLine2: "",
    resCity: "",
    resState: "",
    resCountry: "India",
    resPincode: "",
    permAddressLine1: "",
    permAddressLine2: "",
    permCity: "",
    permState: "",
    permPincode: "",
    // Step 3 – Bank
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    accountType: "",
    upiId: "",
    // Step 4 – Income & Risk
    annualIncome: "",
    occupation: "",
    sourceOfFunds: [] as string[],
    riskAppetite: "",
    // Step 5 – Selfie
    selfieImage: "",
  });
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showConfirmAccountNumber, setShowConfirmAccountNumber] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(true);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const nextErrors: Record<string, string> = {};
    if (!kycData.fullName.trim()) nextErrors.fullName = "Full name is required";
    if (!kycData.email.trim()) nextErrors.email = "Email is required";
    if (!kycData.mobile.trim()) nextErrors.mobile = "Mobile number is required";
    if (!kycData.dateOfBirth) nextErrors.dateOfBirth = "Date of birth is required";
    if (!kycData.gender) nextErrors.gender = "Please select gender";
    if (!kycData.pan.trim()) nextErrors.pan = "PAN is required";
    else if (!PAN_REGEX.test(kycData.pan.replace(/\s/g, ""))) nextErrors.pan = "Invalid PAN format (e.g. ABCDE1234F)";
    const aadhaarDigits = kycData.aadhaar.replace(/\s/g, "");
    if (!aadhaarDigits) nextErrors.aadhaar = "Aadhaar number is required";
    else if (!AADHAAR_REGEX.test(aadhaarDigits)) nextErrors.aadhaar = "Aadhaar must be 12 digits";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    const nextErrors: Record<string, string> = {};
    if (!kycData.resAddressLine1.trim()) nextErrors.resAddressLine1 = "Address Line 1 is required";
    if (!kycData.resAddressLine2.trim()) nextErrors.resAddressLine2 = "Address Line 2 is required";
    if (!kycData.resCity.trim()) nextErrors.resCity = "City is required";
    if (!kycData.resState) nextErrors.resState = "State is required";
    if (!kycData.resPincode.trim()) nextErrors.resPincode = "Pincode is required";
    else if (!PINCODE_REGEX.test(kycData.resPincode)) nextErrors.resPincode = "Pincode must be 6 digits";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep3 = () => {
    const nextErrors: Record<string, string> = {};
    if (!kycData.accountHolderName.trim()) nextErrors.accountHolderName = "Account holder name is required";
    if (!kycData.bankName.trim()) nextErrors.bankName = "Bank name is required";
    if (!kycData.accountNumber.trim()) nextErrors.accountNumber = "Account number is required";
    else if (!/^\d+$/.test(kycData.accountNumber)) nextErrors.accountNumber = "Account number must be numeric only";
    if (!kycData.confirmAccountNumber.trim()) nextErrors.confirmAccountNumber = "Please confirm account number";
    else if (kycData.accountNumber !== kycData.confirmAccountNumber) nextErrors.confirmAccountNumber = "Account numbers do not match";
    if (!kycData.ifscCode.trim()) nextErrors.ifscCode = "IFSC code is required";
    else if (!IFSC_REGEX.test(kycData.ifscCode.replace(/\s/g, ""))) nextErrors.ifscCode = "Invalid IFSC (e.g. SBIN0001234)";
    if (!kycData.accountType) nextErrors.accountType = "Please select account type";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep4 = () => {
    const nextErrors: Record<string, string> = {};
    if (!kycData.annualIncome) nextErrors.annualIncome = "Annual income is required";
    if (!kycData.occupation) nextErrors.occupation = "Occupation is required";
    if (!kycData.riskAppetite) nextErrors.riskAppetite = "Risk appetite is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep5 = () => {
    const nextErrors: Record<string, string> = {};
    if (!kycData.selfieImage) nextErrors.selfie = "Please capture or upload your selfie";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;
    if (currentStep === 5 && !validateStep5()) return;
    if (currentStep === 6) {
      if (!declarationAccepted) {
        setErrors((e) => ({ ...e, declaration: "Please accept the declaration to submit." }));
        return;
      }
      setIsSubmittingKyc(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setErrors((e) => ({ ...e, declaration: "Please log in to submit KYC." }));
        setIsSubmittingKyc(false);
        return;
      }
      try {
        const res = await fetch("/api/investor/kyc", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            documentType: "KYC_SUBMISSION",
            documentNumber: kycData.pan?.trim()?.toUpperCase() || "PENDING",
            selfieImage: kycData.selfieImage || null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          syncInvestorUserKycStatus("pending");
          navigate("/investor/kyc/status", { replace: true });
          return;
        }
        setErrors((e) => ({
          ...e,
          declaration: data.message || "Failed to submit KYC. Please try again.",
        }));
      } catch {
        setErrors((e) => ({ ...e, declaration: "Network error. Please try again." }));
      } finally {
        setIsSubmittingKyc(false);
      }
      return;
    }
    if (currentStep < 6) setCurrentStep((s) => s + 1);
  };

  const handleBackToStep1 = () => setCurrentStep(1);
  const handleBackToStep2 = () => setCurrentStep(2);
  const handleBackToStep3 = () => setCurrentStep(3);
  const handleBackToStep4 = () => setCurrentStep(4);
  const handleBackToStep5 = () => setCurrentStep(5);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setCameraError("Camera access denied or unavailable. Please use Upload Photo.");
    }
  };

  useEffect(() => {
    if (getKycStatus() === "not_started") setKycStatus("in_progress");
  }, []);

  useEffect(() => {
    if (currentStep === 5 && !kycData.selfieImage) startCamera();
    return () => { stopCamera(); };
  }, [currentStep, kycData.selfieImage]);

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    setKycData((d) => ({ ...d, selfieImage: dataUrl }));
  };

  const handleSelfieFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      stopCamera();
      setKycData((d) => ({ ...d, selfieImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const retakeSelfie = () => {
    setKycData((d) => ({ ...d, selfieImage: "" }));
    setCameraError(null);
  };

  const toggleSourceOfFunds = (value: string) => {
    setKycData((d) => ({
      ...d,
      sourceOfFunds: d.sourceOfFunds.includes(value)
        ? d.sourceOfFunds.filter((s) => s !== value)
        : [...d.sourceOfFunds, value],
    }));
  };

  const handleIfscChange = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
    setKycData((d) => ({ ...d, ifscCode: upper }));
  };

  const handleAccountNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setKycData((d) => ({ ...d, accountNumber: digits }));
  };

  const handleConfirmAccountNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setKycData((d) => ({ ...d, confirmAccountNumber: digits }));
  };

  const handleSameAsPermanentChange = (checked: boolean) => {
    setSameAsPermanent(checked);
    if (checked) {
      setKycData((d) => ({
        ...d,
        permAddressLine1: d.resAddressLine1,
        permAddressLine2: d.resAddressLine2,
        permCity: d.resCity,
        permState: d.resState,
        permPincode: d.resPincode,
      }));
    }
  };

  const handlePincodeChange = (value: string, field: "res" | "perm") => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    if (field === "res") setKycData((d) => ({ ...d, resPincode: digits }));
    else setKycData((d) => ({ ...d, permPincode: digits }));
  };

  const handlePanChange = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    setKycData((d) => ({ ...d, pan: upper }));
  };

  const handleAadhaarChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    setKycData((d) => ({ ...d, aadhaar: digits.replace(/(\d{4})/g, "$1 ").trim() }));
  };

  const HERO_BG =
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80";
  const inputClass =
    "w-full rounded-xl border border-white/30 bg-white/20 py-3 px-4 text-base text-white outline-none transition-all duration-200 placeholder:text-white/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 focus:bg-white/25";
  const inputClassDisabled = inputClass + " disabled:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";
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

        <div className="relative z-10 px-4 py-8 sm:py-10">
          <div className="mx-auto w-full min-w-0 max-w-[1000px]">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 overflow-visible rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-10"
            >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Investor KYC Verification
            </h1>
            <span className="inline-flex shrink-0 rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm font-medium text-blue-200 backdrop-blur-sm">
              Step {currentStep} of 6
            </span>
          </div>

          {/* Step progress */}
          <div className="mt-8">
            <div className="flex items-center justify-between gap-1">
              {STEPS.map((label, i) => {
                const stepNum = i + 1;
                const isActive = currentStep === stepNum;
                const isCompleted = currentStep > stepNum;
                return (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-1 flex-col items-center"
                  >
                    <div className="flex w-full items-center">
                      {i > 0 && (
                        <motion.div
                          className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20"
                          aria-hidden
                        >
                          <motion.div
                            className="h-full rounded-full bg-blue-400"
                            initial={false}
                            animate={{ width: currentStep > i ? "100%" : "0%" }}
                            transition={{ duration: 0.4 }}
                          />
                        </motion.div>
                      )}
                      <motion.div
                        initial={false}
                        animate={{
                          scale: isActive ? 1.05 : 1,
                          boxShadow: isActive ? "0 0 20px rgba(96, 165, 250, 0.6)" : "none",
                          backgroundColor: isCompleted || isActive ? "rgba(59, 130, 246, 0.9)" : "rgba(255,255,255,0.15)",
                          color: isCompleted || isActive ? "#fff" : "rgba(255,255,255,0.7)",
                        }}
                        transition={{ duration: 0.3 }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      >
                        {isCompleted ? <Check className="h-5 w-5" /> : stepNum}
                      </motion.div>
                      {i < STEPS.length - 1 && (
                        <motion.div
                          className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20"
                          aria-hidden
                        >
                          <motion.div
                            className="h-full rounded-full bg-blue-400"
                            initial={false}
                            animate={{ width: isCompleted ? "100%" : "0%" }}
                            transition={{ duration: 0.4 }}
                          />
                        </motion.div>
                      )}
                    </div>
                    <span
                      className={`mt-2 text-center text-xs font-medium ${isActive || isCompleted ? "text-blue-200" : "text-white/50"}`}
                    >
                      {label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mt-10">
                <h2 className="text-lg font-semibold text-white">
                  Personal & Government IDs
                </h2>
                <p className="mt-1 text-sm text-white/70">
                  Please provide your details exactly as they appear on your official documents. This helps us verify
                  your identity securely.
                </p>
              </div>

              <form onSubmit={handleContinue} className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-white/90">
                      Full Name (as per PAN)
                    </Label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="e.g. Johnathan Doe"
                      value={kycData.fullName}
                      onChange={(e) => setKycData((d) => ({ ...d, fullName: e.target.value }))}
                      className={inputClass}
                    />
                    {errors.fullName && <p className="text-sm text-red-300">{errors.fullName}</p>}
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-white/90">
                      Email Address
                    </Label>
                    <input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={kycData.email}
                      onChange={(e) => setKycData((d) => ({ ...d, email: e.target.value }))}
                      className={inputClass}
                    />
                    {errors.email && <p className="text-sm text-red-300">{errors.email}</p>}
                  </motion.div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="mobile" className="text-sm font-medium text-white/90">
                      Mobile Number
                    </Label>
                    <div className="relative">
                      <input
                        id="mobile"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={kycData.mobile}
                        onChange={(e) => setKycData((d) => ({ ...d, mobile: e.target.value }))}
                        className={`${inputClass} ${mobileVerified ? "pr-28" : ""}`}
                      />
                      {mobileVerified && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">
                          OTP VERIFIED
                        </span>
                      )}
                    </div>
                    {errors.mobile && <p className="text-sm text-red-300">{errors.mobile}</p>}
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium text-white/90">
                      Date of Birth
                    </Label>
                    <div className="relative">
                      <input
                        id="dateOfBirth"
                        type="date"
                        value={kycData.dateOfBirth}
                        onChange={(e) => setKycData((d) => ({ ...d, dateOfBirth: e.target.value }))}
                        className={`${inputClass} pr-10 [color-scheme:dark]`}
                      />
                      <Calendar className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none text-white/50" aria-hidden />
                    </div>
                    {errors.dateOfBirth && <p className="text-sm text-red-300">{errors.dateOfBirth}</p>}
                  </motion.div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }} className="space-y-2">
                    <Dropdown
                      id="gender"
                      label="Gender"
                      placeholder="Select Gender"
                      options={[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "other", label: "Other" },
                      ]}
                      value={kycData.gender}
                      onChange={(v) => setKycData((d) => ({ ...d, gender: v }))}
                      error={errors.gender}
                      variant="glass"
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="pan" className="text-sm font-medium text-white/90">PAN Number</Label>
                    <div className="relative">
                      <input
                        id="pan"
                        type="text"
                        placeholder="ABCDE1234F"
                        value={kycData.pan}
                        onChange={(e) => handlePanChange(e.target.value)}
                        maxLength={10}
                        className={`${inputClass} pr-12`}
                      />
                      <Lock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" aria-hidden />
                    </div>
                    <p className="text-xs text-white/50">Sensitive — stored encrypted</p>
                    {errors.pan && <p className="text-sm text-red-300">{errors.pan}</p>}
                  </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }} className="space-y-2">
                  <Label htmlFor="aadhaar" className="text-sm font-medium text-white/90">Aadhaar Number (12 Digits)</Label>
                  <div className="relative">
                    <input
                      id="aadhaar"
                      type="text"
                      inputMode="numeric"
                      placeholder="0000 0000 0000"
                      value={kycData.aadhaar}
                      onChange={(e) => handleAadhaarChange(e.target.value)}
                      maxLength={14}
                      className={`${inputClass} pr-12`}
                    />
                    <Lock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" aria-hidden />
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-white/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" aria-hidden />
                    Your Aadhaar number is encrypted and never stored on our servers in plain text.
                  </p>
                  {errors.aadhaar && <p className="text-sm text-red-300">{errors.aadhaar}</p>}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="flex flex-wrap items-center gap-6 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white/80 backdrop-blur-sm"
                >
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-300" aria-hidden />
                    256-bit SSL Encryption
                  </motion.span>
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-300" aria-hidden />
                    Bank-grade Protection
                  </motion.span>
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-300" aria-hidden />
                    Data Encrypted
                  </motion.span>
                </motion.div>

                <div className="flex flex-col gap-6 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 shrink-0 text-blue-300" aria-hidden />
                    <div className="text-sm text-white/70">
                      <p className="font-medium text-white">Secure 256-bit SSL Encryption</p>
                      <p>Bank-grade data protection</p>
                    </div>
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="shrink-0 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3.5 px-6 text-base font-semibold text-white shadow-lg shadow-blue-500/40 transition-colors hover:from-blue-600 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white/10"
                  >
                    Continue to Step 2
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mt-10">
                <h2 className="text-lg font-semibold text-white">
                  Residential Address Details
                </h2>
                <p className="mt-1 text-sm text-white/70">
                  Please provide your current residential address as per official records.
                </p>
              </div>

              <form onSubmit={handleContinue} className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="resAddressLine1" className="text-sm font-medium text-white">
                      Address Line 1 (House / Flat / Building Name)
                    </Label>
                    <input
                      id="resAddressLine1"
                      type="text"
                      placeholder="e.g. Flat 4B, Sunrise Apartments"
                      value={kycData.resAddressLine1}
                      onChange={(e) => setKycData((d) => ({ ...d, resAddressLine1: e.target.value }))}
                      className={inputClass}
                    />
                    {errors.resAddressLine1 && <p className="text-sm text-red-300">{errors.resAddressLine1}</p>}
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="resAddressLine2" className="text-sm font-medium text-white">
                      Address Line 2 (Street / Area / Landmark)
                    </Label>
                    <input
                      id="resAddressLine2"
                      type="text"
                      placeholder="e.g. MG Road, Near City Mall"
                      value={kycData.resAddressLine2}
                      onChange={(e) => setKycData((d) => ({ ...d, resAddressLine2: e.target.value }))}
                      className={inputClass}
                    />
                    {errors.resAddressLine2 && <p className="text-sm text-red-300">{errors.resAddressLine2}</p>}
                  </motion.div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="resCity" className="text-sm font-medium text-white">City</Label>
                    <input
                      id="resCity"
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={kycData.resCity}
                      onChange={(e) => setKycData((d) => ({ ...d, resCity: e.target.value }))}
                      className={inputClass}
                    />
                    {errors.resCity && <p className="text-sm text-red-300">{errors.resCity}</p>}
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.3 }} className="space-y-2">
                    <Dropdown
                      id="resState"
                      label="State"
                      placeholder="Select State"
                      options={INDIAN_STATES}
                      value={kycData.resState}
                      onChange={(v) => setKycData((d) => ({ ...d, resState: v }))}
                      error={errors.resState}
                      variant="glass"
                    />
                  </motion.div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="resCountry" className="text-sm font-medium text-white">Country</Label>
                    <input
                      id="resCountry"
                      type="text"
                      value={kycData.resCountry}
                      disabled
                      className={inputClassDisabled}
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="resPincode" className="text-sm font-medium text-white">Pincode (6 digits)</Label>
                    <input
                      id="resPincode"
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 400001"
                      value={kycData.resPincode}
                      onChange={(e) => handlePincodeChange(e.target.value, "res")}
                      maxLength={6}
                      className={inputClass}
                    />
                    {errors.resPincode && <p className="text-sm text-red-300">{errors.resPincode}</p>}
                  </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }} className="flex items-start gap-3">
                  <input
                    id="sameAsPermanent"
                    type="checkbox"
                    checked={sameAsPermanent}
                    onChange={(e) => handleSameAsPermanentChange(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-300 focus:ring-2 focus:ring-blue-400/40"
                  />
                  <Label htmlFor="sameAsPermanent" className="cursor-pointer text-sm font-normal text-white/70">
                    Same as permanent address
                  </Label>
                </motion.div>

                {!sameAsPermanent && (
                  <div className="space-y-5 rounded-xl border border-white/20 bg-white/10 p-6">
                    <h3 className="text-base font-semibold text-white">Permanent Address (if different)</h3>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="permAddressLine1" className="text-sm font-medium text-white">Address Line 1</Label>
                        <input id="permAddressLine1" type="text" placeholder="House / Flat / Building Name" value={kycData.permAddressLine1} onChange={(e) => setKycData((d) => ({ ...d, permAddressLine1: e.target.value }))} className={inputClass} />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="permAddressLine2" className="text-sm font-medium text-white">Address Line 2</Label>
                        <input id="permAddressLine2" type="text" placeholder="Street / Area / Landmark" value={kycData.permAddressLine2} onChange={(e) => setKycData((d) => ({ ...d, permAddressLine2: e.target.value }))} className={inputClass} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="permCity" className="text-sm font-medium text-white">City</Label>
                        <input id="permCity" type="text" placeholder="e.g. Mumbai" value={kycData.permCity} onChange={(e) => setKycData((d) => ({ ...d, permCity: e.target.value }))} className={inputClass} />
                      </div>
                      <div className="space-y-2">
                        <Dropdown
                          id="permState"
                          label="State"
                          placeholder="Select State"
                          options={INDIAN_STATES}
                          value={kycData.permState}
                          onChange={(v) => setKycData((d) => ({ ...d, permState: v }))}
                          variant="glass"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="permPincode" className="text-sm font-medium text-white">Pincode</Label>
                        <input id="permPincode" type="text" inputMode="numeric" placeholder="6 digits" value={kycData.permPincode} onChange={(e) => handlePincodeChange(e.target.value, "perm")} maxLength={6} className={inputClass} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-6 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 shrink-0 text-blue-300" aria-hidden />
                    <div className="text-sm text-white/70">
                      <p className="font-medium text-white">Your address details are securely stored</p>
                      <p>and used only for verification purposes.</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <motion.button type="button" onClick={handleBackToStep1} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl border-2 border-white/20 py-3.5 px-6 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2">
                      Back to Step 1
                    </motion.button>
                    <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3.5 px-6 text-base font-semibold text-white shadow-lg shadow-blue-500/40 transition-colors hover:from-blue-600 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white/10">
                      Continue to Step 3
                    </motion.button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mt-10">
                <h2 className="text-lg font-semibold text-white">Bank Account Details</h2>
                <p className="mt-1 text-sm text-white/70">
                  Provide your bank details for investment transactions and payouts. Your information is securely encrypted.
                </p>
              </div>

              <form onSubmit={handleContinue} className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="accountHolderName" className="text-sm font-medium text-white">Account Holder Name (As per bank records)</Label>
                    <input id="accountHolderName" type="text" placeholder="e.g. John Doe" value={kycData.accountHolderName} onChange={(e) => setKycData((d) => ({ ...d, accountHolderName: e.target.value }))} className={inputClass} />
                    {errors.accountHolderName && <p className="text-sm text-red-300">{errors.accountHolderName}</p>}
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="bankName" className="text-sm font-medium text-white">Bank Name</Label>
                    <input id="bankName" type="text" placeholder="e.g. State Bank of India" value={kycData.bankName} onChange={(e) => setKycData((d) => ({ ...d, bankName: e.target.value }))} className={inputClass} />
                    {errors.bankName && <p className="text-sm text-red-300">{errors.bankName}</p>}
                  </motion.div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="accountNumber" className="text-sm font-medium text-white">Account Number</Label>
                    <div className="relative">
                      <input id="accountNumber" type={showAccountNumber ? "text" : "password"} inputMode="numeric" placeholder="Numeric only" value={kycData.accountNumber} onChange={(e) => handleAccountNumberChange(e.target.value)} className={`${inputClass} pr-12`} />
                      <button type="button" onClick={() => setShowAccountNumber(!showAccountNumber)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/50 hover:bg-white/20" aria-label={showAccountNumber ? "Hide account number" : "Show account number"}>
                        {showAccountNumber ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-white/50"><Lock className="h-3.5 w-3.5 text-blue-300" aria-hidden /> Sensitive — stored encrypted</p>
                    {errors.accountNumber && <p className="text-sm text-red-300">{errors.accountNumber}</p>}
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="confirmAccountNumber" className="text-sm font-medium text-white">Confirm Account Number</Label>
                    <div className="relative">
                      <input id="confirmAccountNumber" type={showConfirmAccountNumber ? "text" : "password"} inputMode="numeric" placeholder="Re-enter account number" value={kycData.confirmAccountNumber} onChange={(e) => handleConfirmAccountNumberChange(e.target.value)} className={`${inputClass} pr-12`} />
                      <button type="button" onClick={() => setShowConfirmAccountNumber(!showConfirmAccountNumber)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/50 hover:bg-white/20" aria-label={showConfirmAccountNumber ? "Hide" : "Show"}>
                        {showConfirmAccountNumber ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmAccountNumber && <p className="text-sm text-red-300">{errors.confirmAccountNumber}</p>}
                  </motion.div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }} className="space-y-2">
                    <Label htmlFor="ifscCode" className="text-sm font-medium text-white">IFSC Code</Label>
                    <input id="ifscCode" type="text" placeholder="e.g. SBIN0001234" value={kycData.ifscCode} onChange={(e) => handleIfscChange(e.target.value)} maxLength={11} className={inputClass} />
                    {errors.ifscCode && <p className="text-sm text-red-300">{errors.ifscCode}</p>}
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.3 }} className="space-y-2">
                    <Dropdown
                      id="accountType"
                      label="Account Type"
                      placeholder="Select Account Type"
                      options={[
                        { value: "savings", label: "Savings" },
                        { value: "current", label: "Current" },
                      ]}
                      value={kycData.accountType}
                      onChange={(v) => setKycData((d) => ({ ...d, accountType: v }))}
                      error={errors.accountType}
                      variant="glass"
                    />
                  </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }} className="space-y-2">
                  <Label htmlFor="upiId" className="text-sm font-medium text-white">UPI ID <span className="font-normal text-white/50">(Optional)</span></Label>
                  <input id="upiId" type="text" placeholder="e.g. name@upi" value={kycData.upiId} onChange={(e) => setKycData((d) => ({ ...d, upiId: e.target.value }))} className={inputClass} />
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.4 }} className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <Info className="h-5 w-5 shrink-0 mt-0.5 text-blue-300" aria-hidden />
                  <p className="text-sm text-white/80">Bank account will be verified via penny-drop or micro-deposit for authenticity.</p>
                </motion.div>

                <div className="flex flex-col gap-6 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 shrink-0 text-blue-300" aria-hidden />
                    <div className="text-sm text-white/70">
                      <p className="font-medium text-white">Bank-grade 256-bit SSL encryption</p>
                      <p>Your financial data is fully protected.</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <motion.button type="button" onClick={handleBackToStep2} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl border-2 border-white/20 py-3.5 px-6 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2">Back to Step 2</motion.button>
                    <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3.5 px-6 text-base font-semibold text-white shadow-lg shadow-blue-500/40 transition-colors hover:from-blue-600 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white/10">Continue to Step 4</motion.button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mt-10">
                <h2 className="text-lg font-semibold text-white">Income & Investment Profile</h2>
                <p className="mt-1 text-sm text-white/70">This information helps us assess your investment suitability and risk profile.</p>
              </div>

              <form onSubmit={handleContinue} className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3 }} className="space-y-2">
                    <Dropdown
                      id="annualIncome"
                      label="Annual Income"
                      placeholder="Select Annual Income"
                      options={[
                        { value: "below_5", label: "Below ₹5 Lakhs" },
                        { value: "5_10", label: "₹5–10 Lakhs" },
                        { value: "10_25", label: "₹10–25 Lakhs" },
                        { value: "above_25", label: "Above ₹25 Lakhs" },
                      ]}
                      value={kycData.annualIncome}
                      onChange={(v) => setKycData((d) => ({ ...d, annualIncome: v }))}
                      error={errors.annualIncome}
                      variant="glass"
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.3 }} className="space-y-2">
                    <Dropdown
                      id="occupation"
                      label="Occupation"
                      placeholder="Select Occupation"
                      options={[
                        { value: "salaried", label: "Salaried" },
                        { value: "self_employed", label: "Self-Employed" },
                        { value: "business_owner", label: "Business Owner" },
                        { value: "retired", label: "Retired" },
                        { value: "other", label: "Other" },
                      ]}
                      value={kycData.occupation}
                      onChange={(v) => setKycData((d) => ({ ...d, occupation: v }))}
                      error={errors.occupation}
                      variant="glass"
                    />
                  </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }} className="space-y-2">
                  <Label className="text-sm font-medium text-white">Source of Funds</Label>
                  <div className="flex flex-wrap gap-4 rounded-xl border border-white/20 bg-white/10 p-4">
                    {["Salary", "Business Income", "Savings", "Investments", "Inheritance"].map((option) => (
                      <label key={option} className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={kycData.sourceOfFunds.includes(option)} onChange={() => toggleSourceOfFunds(option)} className="h-4 w-4 rounded border-gray-300 text-blue-300 focus:ring-2 focus:ring-blue-400/40" />
                        <span className="text-sm text-white">{option}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }} className="space-y-3">
                  <h3 className="text-base font-semibold text-white">Risk Appetite</h3>
                  <div className="space-y-3 rounded-xl border border-white/20 bg-white/10 p-4">
                    {[
                      { value: "low", label: "Low", desc: "Stable returns, low risk" },
                      { value: "medium", label: "Medium", desc: "Balanced risk & returns" },
                      { value: "high", label: "High", desc: "Higher risk, higher returns" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${kycData.riskAppetite === opt.value ? "border-blue-400 bg-white/15" : "border-white/20 hover:border-gray-300"}`}
                      >
                        <input type="radio" name="riskAppetite" value={opt.value} checked={kycData.riskAppetite === opt.value} onChange={() => setKycData((d) => ({ ...d, riskAppetite: opt.value }))} className="mt-1 h-4 w-4 border-gray-300 text-blue-300 focus:ring-2 focus:ring-blue-400/40" />
                        <div>
                          <span className="text-sm font-medium text-white">{opt.label}</span>
                          <p className="text-xs mt-0.5 text-white/70">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.riskAppetite && <p className="text-sm text-red-300">{errors.riskAppetite}</p>}
                </motion.div>

                <div className="flex flex-col gap-6 pt-4 sm:flex-row sm:items-center sm:justify-end">
                  <div className="hidden sm:block sm:flex-1" />
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <motion.button type="button" onClick={handleBackToStep3} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl border-2 border-white/20 py-3.5 px-6 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2">Back to Step 3</motion.button>
                    <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3.5 px-6 text-base font-semibold text-white shadow-lg shadow-blue-500/40 transition-colors hover:from-blue-600 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white/10">Continue to Step 5</motion.button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mt-10">
                <h2 className="text-lg font-semibold text-white">Selfie Verification</h2>
                <p className="mt-1 text-sm text-white/70">Capture a clear selfie to verify your identity.</p>
              </div>

              <div className="mt-6 space-y-5">
                {!kycData.selfieImage ? (
                  <>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/20 bg-black">
                      {cameraError ? (
                        <div className="flex h-full items-center justify-center p-6 text-center">
                          <p className="text-sm text-white/90">{cameraError}</p>
                        </div>
                      ) : (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <ul className="list-inside list-disc space-y-1 text-sm text-white/70">
                      <li>Face clearly visible</li>
                      <li>No mask / sunglasses</li>
                      <li>Good lighting</li>
                    </ul>
                    <div className="flex flex-wrap items-center gap-3">
                      <motion.button type="button" onClick={captureSelfie} disabled={!!cameraError} whileHover={!cameraError ? { scale: 1.03 } : undefined} whileTap={!cameraError ? { scale: 0.97 } : undefined} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3.5 px-6 text-base font-semibold text-white shadow-lg shadow-blue-500/40 transition-colors disabled:opacity-50 hover:from-blue-600 hover:to-blue-700">
                        <Camera className="h-5 w-5" />
                        Capture Selfie
                      </motion.button>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-white/20 py-3.5 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2">
                        <Upload className="h-5 w-5" />
                        Upload Photo
                        <input type="file" accept="image/*" capture="user" onChange={handleSelfieFile} className="sr-only" />
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-white/20 overflow-hidden">
                      <img src={kycData.selfieImage} alt="Selfie preview" className="aspect-[4/3] w-full object-cover" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <motion.button type="button" onClick={retakeSelfie} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl border-2 border-white/20 py-3.5 px-6 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/10">
                        Retake
                      </motion.button>
                      <motion.button type="button" onClick={(e) => { e.preventDefault(); if (validateStep5()) setCurrentStep(6); }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3.5 px-6 text-base font-semibold text-white shadow-lg shadow-blue-500/40 transition-colors hover:from-blue-600 hover:to-blue-700">
                        Confirm & Continue
                      </motion.button>
                    </div>
                  </>
                )}

                {errors.selfie && <p className="text-sm text-red-300">{errors.selfie}</p>}
                <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                  <Shield className="h-5 w-5 shrink-0 text-blue-300" aria-hidden />
                  <p className="text-sm text-white/70">Your selfie is securely encrypted and used only for identity verification.</p>
                </div>

                <div className="flex flex-col gap-6 pt-4 sm:flex-row sm:items-center sm:justify-end">
                  <div className="hidden sm:block sm:flex-1" />
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <motion.button type="button" onClick={handleBackToStep4} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl border-2 border-white/20 py-3.5 px-6 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2">Back to Step 4</motion.button>
                    <motion.button type="button" onClick={(e) => { e.preventDefault(); handleContinue(e as unknown as React.FormEvent); }} disabled={!kycData.selfieImage} whileHover={kycData.selfieImage ? { scale: 1.03 } : undefined} whileTap={kycData.selfieImage ? { scale: 0.97 } : undefined} className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3.5 px-6 text-base font-semibold text-white shadow-lg shadow-blue-500/40 transition-colors hover:from-blue-600 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white/10 disabled:opacity-50 disabled:hover:from-blue-500 disabled:hover:to-blue-600">
                      Continue to Step 6
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mt-10">
                <h2 className="text-lg font-semibold text-white">Review & Submit Your KYC</h2>
                <p className="mt-1 text-sm text-white/70">Please carefully review your details before submitting for verification.</p>
              </div>

              <div className="mt-6 space-y-5">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3 }} className="rounded-xl border border-white/20 bg-white/10 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-semibold text-white">Personal Details</h3>
                    <button type="button" onClick={() => setCurrentStep(1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 transition-colors hover:opacity-90">
                      Edit <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="font-medium text-white/70">Full Name</dt><dd className="text-white">{kycData.fullName || "—"}</dd></div>
                    <div><dt className="font-medium text-white/70">Email Address</dt><dd className="text-white">{kycData.email || "—"}</dd></div>
                    <div><dt className="font-medium text-white/70">Mobile Number</dt><dd className="text-white">{kycData.mobile || "—"}</dd></div>
                    <div><dt className="font-medium text-white/70">Date of Birth</dt><dd className="text-white">{kycData.dateOfBirth || "—"}</dd></div>
                    <div><dt className="font-medium text-white/70">Gender</dt><dd className="text-white">{kycData.gender ? kycData.gender.charAt(0).toUpperCase() + kycData.gender.slice(1) : "—"}</dd></div>
                    <div><dt className="font-medium text-white/70">PAN Number</dt><dd className="text-white">{kycData.pan ? maskPan(kycData.pan) : "—"}</dd></div>
                    <div><dt className="font-medium text-white/70">Aadhaar Number</dt><dd className="text-white">{kycData.aadhaar ? maskAadhaar(kycData.aadhaar) : "—"}</dd></div>
                  </dl>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }} className="rounded-xl border border-white/20 bg-white/10 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-semibold text-white">Address Details</h3>
                    <button type="button" onClick={() => setCurrentStep(2)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 transition-colors hover:opacity-90">Edit <ChevronRight className="h-4 w-4" /></button>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div><dt className="font-medium text-white/70">Residential Address</dt><dd className="text-white">{[kycData.resAddressLine1, kycData.resAddressLine2].filter(Boolean).join(", ") || "—"}</dd></div>
                    <div><dt className="font-medium text-white/70">City, State, Country</dt><dd className="text-white">{[kycData.resCity, kycData.resState, kycData.resCountry].filter(Boolean).join(", ") || "—"}</dd></div>
                    <div><dt className="font-medium text-white/70">Pincode</dt><dd className="text-white">{kycData.resPincode || "—"}</dd></div>
                    {!(kycData.permAddressLine1 || kycData.permCity) ? null : (
                      <div><dt className="font-medium text-white/70">Permanent Address</dt><dd className="text-white">{[kycData.permAddressLine1, kycData.permAddressLine2, kycData.permCity, kycData.permState, kycData.permPincode].filter(Boolean).join(", ") || "—"}</dd></div>
                    )}
                  </dl>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }} className="rounded-xl border border-white/20 bg-white/10 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-semibold text-white">Bank Information</h3>
                    <button type="button" onClick={() => setCurrentStep(3)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 transition-colors hover:opacity-90">Edit <ChevronRight className="h-4 w-4" /></button>
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="font-medium text-white/70">Account Holder Name</dt><dd className="text-white">{kycData.accountHolderName || "—"}</dd></div>
                    <div><dt className="font-medium text-white/70">Bank Name</dt><dd className="text-white">{kycData.bankName || "—"}</dd></div>
                    <div><dt className="font-medium text-white/70">Account Number</dt><dd className="text-white">{kycData.accountNumber ? "****" + maskAccountLast4(kycData.accountNumber) : "—"}</dd></div>
                    <div><dt className="font-medium text-white/70">IFSC Code</dt><dd className="text-white">{kycData.ifscCode || "—"}</dd></div>
                    <div><dt className="font-medium text-white/70">Account Type</dt><dd className="text-white">{kycData.accountType ? kycData.accountType.charAt(0).toUpperCase() + kycData.accountType.slice(1) : "—"}</dd></div>
                  </dl>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }} className="rounded-xl border border-white/20 bg-white/10 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-semibold text-white">Income & Risk Profile</h3>
                    <button type="button" onClick={() => setCurrentStep(4)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 transition-colors hover:opacity-90">Edit <ChevronRight className="h-4 w-4" /></button>
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="font-medium text-white/70">Annual Income Range</dt><dd className="text-white">{ANNUAL_INCOME_LABELS[kycData.annualIncome] || kycData.annualIncome || "—"}</dd></div>
                    <div><dt className="font-medium text-white/70">Occupation</dt><dd className="text-white">{OCCUPATION_LABELS[kycData.occupation] || kycData.occupation || "—"}</dd></div>
                    <div className="sm:col-span-2"><dt className="font-medium text-white/70">Source of Funds</dt><dd className="text-white">{kycData.sourceOfFunds?.length ? kycData.sourceOfFunds.join(", ") : "—"}</dd></div>
                    <div><dt className="font-medium text-white/70">Risk Appetite</dt><dd className="text-white">{RISK_APPETITE_LABELS[kycData.riskAppetite] || kycData.riskAppetite || "—"}</dd></div>
                  </dl>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.3 }} className="rounded-xl border border-white/20 bg-white/10 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-semibold text-white">Selfie Verification</h3>
                    <button type="button" onClick={() => setCurrentStep(5)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 transition-colors hover:opacity-90">Retake <ChevronRight className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    {kycData.selfieImage ? (
                      <img src={kycData.selfieImage} alt="Selfie" className="h-16 w-16 rounded-xl border border-white/20 object-cover" />
                    ) : null}
                    <span className="text-sm font-medium text-blue-300">Captured</span>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }} className="rounded-xl border border-white/20 p-5">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" checked={declarationAccepted} onChange={(e) => { setDeclarationAccepted(e.target.checked); setErrors((err) => ({ ...err, declaration: "" })); }} className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-300 focus:ring-2 focus:ring-blue-400/40" />
                    <span className="text-sm text-white">I confirm that the information provided above is true and correct to the best of my knowledge.</span>
                  </label>
                  <p className="mt-2 text-xs text-white/70">Providing false information may result in account suspension.</p>
                  {errors.declaration && <p className="mt-1 text-sm text-red-300">{errors.declaration}</p>}
                </motion.div>

                <div className="flex flex-col gap-6 pt-4 sm:flex-row sm:items-center sm:justify-end">
                  <div className="hidden sm:block sm:flex-1" />
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <motion.button type="button" onClick={handleBackToStep5} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl border-2 border-white/20 py-3.5 px-6 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2">Back to Step 5</motion.button>
                    <motion.button type="button" onClick={(e) => { e.preventDefault(); handleContinue(e as unknown as React.FormEvent); }} disabled={!declarationAccepted || isSubmittingKyc} whileHover={declarationAccepted && !isSubmittingKyc ? { scale: 1.03 } : undefined} whileTap={declarationAccepted && !isSubmittingKyc ? { scale: 0.97 } : undefined} className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3.5 px-6 text-base font-semibold text-white shadow-lg shadow-blue-500/40 transition-colors hover:from-blue-600 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white/10 disabled:opacity-50 disabled:hover:from-blue-500 disabled:hover:to-blue-600">
                      {isSubmittingKyc ? "Submitting…" : "Submit KYC for Verification"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
            </motion.div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
