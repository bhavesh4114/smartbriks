import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, Check, ChevronRight, Upload, Lock } from "lucide-react";
import {
  getBuilderKycStatus,
  setBuilderKycStatus,
  syncBuilderKycStatus,
} from "../../config/builderKyc";
import { Label } from "../../components/ui/label";
import { SiteHeader } from "../../components/layout/SiteHeader";
import { SiteFooter } from "../../components/layout/SiteFooter";

const STEPS = [
  "Company",
  "Address",
  "Documents",
  "Bank",
  "Authorized Person",
  "Review",
];

const BUSINESS_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "partnership", label: "Partnership" },
  { value: "private_limited", label: "Private Limited" },
  { value: "llp", label: "LLP" },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
];

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const PINCODE_REGEX = /^\d{6}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function maskPan(pan: string): string {
  const s = pan.replace(/\s/g, "");
  if (s.length < 4) return "*****";
  return s.slice(0, 2) + "***" + s.slice(-2);
}
function maskAccountLast4(account: string): string {
  const d = account.replace(/\D/g, "");
  if (d.length < 4) return "****";
  return d.slice(-4);
}

export default function BuilderKyc() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [kycData, setKycData] = useState({
    companyName: "",
    businessType: "",
    yearOfEstablishment: "",
    companyPan: "",
    gstNumber: "",
    officialEmail: "",
    officialMobile: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    sameAsSiteOffice: false,
    companyPanFile: "",
    gstCertificateFile: "",
    cinLlpinFile: "",
    reraNumber: "",
    reraCertificateFile: "",
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    cancelledChequeFile: "",
    authPersonName: "",
    designation: "",
    authPersonMobile: "",
    authPersonEmail: "",
    authPersonPan: "",
    idProofFile: "",
    selfieWithIdFile: "",
  });
  const [officialMobileVerified, setOfficialMobileVerified] = useState(true);
  const [authMobileVerified, setAuthMobileVerified] = useState(true);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [documentImageFile, setDocumentImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const nextErrors: Record<string, string> = {};
    if (!kycData.companyName.trim()) nextErrors.companyName = "Company / Builder name is required";
    if (!kycData.businessType) nextErrors.businessType = "Business type is required";
    if (!kycData.yearOfEstablishment.trim()) nextErrors.yearOfEstablishment = "Year of establishment is required";
    if (!kycData.companyPan.trim()) nextErrors.companyPan = "Company PAN is required";
    else if (!PAN_REGEX.test(kycData.companyPan.replace(/\s/g, ""))) nextErrors.companyPan = "Invalid PAN format (e.g. ABCDE1234F)";
    if (!kycData.officialEmail.trim()) nextErrors.officialEmail = "Official email is required";
    if (!kycData.officialMobile.trim()) nextErrors.officialMobile = "Official mobile is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    const nextErrors: Record<string, string> = {};
    if (!kycData.addressLine1.trim()) nextErrors.addressLine1 = "Address Line 1 is required";
    if (!kycData.city.trim()) nextErrors.city = "City is required";
    if (!kycData.state) nextErrors.state = "State is required";
    if (!kycData.pincode.trim()) nextErrors.pincode = "Pincode is required";
    else if (!PINCODE_REGEX.test(kycData.pincode)) nextErrors.pincode = "Pincode must be 6 digits";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep3 = () => {
    const nextErrors: Record<string, string> = {};
    if (!kycData.companyPanFile) nextErrors.companyPanFile = "Company PAN Card upload is required";
    if (!kycData.gstCertificateFile) nextErrors.gstCertificateFile = "GST Certificate upload is required";
    if (!kycData.reraCertificateFile) nextErrors.reraCertificateFile = "RERA Certificate upload is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep4 = () => {
    const nextErrors: Record<string, string> = {};
    if (!kycData.accountHolderName.trim()) nextErrors.accountHolderName = "Account holder name is required";
    if (!kycData.bankName.trim()) nextErrors.bankName = "Bank name is required";
    if (!kycData.accountNumber.trim()) nextErrors.accountNumber = "Account number is required";
    if (!kycData.ifscCode.trim()) nextErrors.ifscCode = "IFSC code is required";
    else if (!IFSC_REGEX.test(kycData.ifscCode.replace(/\s/g, ""))) nextErrors.ifscCode = "Invalid IFSC (e.g. SBIN0001234)";
    if (!kycData.cancelledChequeFile) nextErrors.cancelledChequeFile = "Cancelled cheque upload is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep5 = () => {
    const nextErrors: Record<string, string> = {};
    if (!kycData.authPersonName.trim()) nextErrors.authPersonName = "Full name is required";
    if (!kycData.designation.trim()) nextErrors.designation = "Designation is required";
    if (!kycData.authPersonMobile.trim()) nextErrors.authPersonMobile = "Mobile number is required";
    if (!kycData.authPersonEmail.trim()) nextErrors.authPersonEmail = "Email is required";
    if (!kycData.authPersonPan.trim()) nextErrors.authPersonPan = "PAN is required";
    else if (!PAN_REGEX.test(kycData.authPersonPan.replace(/\s/g, ""))) nextErrors.authPersonPan = "Invalid PAN format";
    if (!kycData.idProofFile) nextErrors.idProofFile = "ID Proof upload is required";
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
        setErrors((err) => ({ ...err, declaration: "Please accept the declaration to submit." }));
        return;
      }
      setIsSubmittingKyc(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setErrors((err) => ({ ...err, declaration: "Please log in to submit KYC." }));
        setIsSubmittingKyc(false);
        return;
      }
      try {
        const formData = new FormData();
        formData.append("documentType", "BUILDER_KYC_SUBMISSION");
        formData.append("documentNumber", kycData.companyPan?.trim()?.toUpperCase() || "PENDING");
        const file = documentImageFile;
        if (file) {
          formData.append("documentImage", file);
        }

        const res = await fetch("/api/builder/kyc", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.success) {
          syncBuilderKycStatus("pending");
          navigate("/builder/dashboard", { replace: true });
          return;
        }
        setErrors((err) => ({
          ...err,
          declaration: data?.message || "Failed to submit Builder KYC. Please try again.",
        }));
      } catch {
        setErrors((err) => ({
          ...err,
          declaration: "Network error. Please try again.",
        }));
      } finally {
        setIsSubmittingKyc(false);
      }
      return;
    }
    if (currentStep < 6) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handlePanChange = (value: string, field: "company" | "auth") => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    if (field === "company") setKycData((d) => ({ ...d, companyPan: upper }));
    else setKycData((d) => ({ ...d, authPersonPan: upper }));
  };

  const handleIfscChange = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
    setKycData((d) => ({ ...d, ifscCode: upper }));
  };

  const handlePincodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setKycData((d) => ({ ...d, pincode: digits }));
  };

  const handleMockFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof kycData
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setKycData((d) => ({ ...d, [field]: file.name }));
      if (field === "idProofFile") {
        setDocumentImageFile(file);
      }
    }
    e.target.value = "";
  };

  useEffect(() => {
    if (getBuilderKycStatus() === "not_started") setBuilderKycStatus("in_progress");
  }, []);

  const inputClass =
    "w-full rounded-xl border border-white/30 bg-white/20 py-3 px-4 text-base text-white outline-none transition-all duration-200 placeholder:text-white/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 focus:bg-white/25";
  const inputStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    color: "#FFFFFF",
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>, focus: boolean) => {
    e.target.style.borderColor = focus ? "#60A5FA" : "rgba(255, 255, 255, 0.3)";
    (e.target as HTMLInputElement).style.boxShadow = focus ? "0 0 0 3px rgba(96,165,250,0.4)" : "none";
  };

  const primaryBtnClass =
    "shrink-0 rounded-xl py-3.5 px-6 text-base font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2";
  const primaryBtnStyle = { backgroundColor: "#2563EB" };
  const secondaryBtnClass =
    "rounded-xl border-2 border-white/20 py-3.5 px-6 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2";
  const secondaryBtnStyle = { borderColor: "rgba(255,255,255,0.2)", color: "#FFFFFF" };
  const HERO_BG =
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80";

  return (
    <>
      <SiteHeader authenticated />
      <main className="relative min-h-screen min-w-0 pt-16">
        <div className="fixed inset-0 -z-10">
          <img
            src={HERO_BG}
            alt=""
            className="h-full w-full object-cover blur-[2px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-slate-900/75 to-blue-900/60" />
        </div>

        <div className="relative z-10 min-w-0 px-4 py-8 sm:py-10">
          <div className="mx-auto w-full min-w-0 max-w-[1000px]">
            <div className="relative z-10">
              <div
                className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-10"
                style={{ color: "#FFFFFF" }}
              >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-white">
                  Builder KYC Verification
                </h1>
                <span className="inline-flex shrink-0 rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm font-medium text-blue-200 backdrop-blur-sm">
                  Step {currentStep} of 6
                </span>
              </div>

              {/* Stepper */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  {STEPS.map((label, i) => {
                    const stepNum = i + 1;
                    const isActive = currentStep === stepNum;
                    const isCompleted = currentStep > stepNum;
                    return (
                      <div key={label} className="flex flex-1 flex-col items-center">
                        <div className="flex w-full items-center">
                          {i > 0 && (
                            <div className="h-0.5 flex-1 bg-white/20" aria-hidden />
                          )}
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors"
                            style={
                              isCompleted || isActive
                                ? { backgroundColor: "rgba(59, 130, 246, 0.9)", color: "#FFFFFF" }
                                : { backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }
                            }
                          >
                            {isCompleted ? <Check className="h-5 w-5" /> : stepNum}
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className="h-0.5 flex-1 bg-white/20" aria-hidden />
                          )}
                        </div>
                        <span
                          className="mt-2 text-center text-xs font-medium"
                          style={isActive || isCompleted ? { color: "#BFDBFE" } : { color: "rgba(255,255,255,0.5)" }}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 1: Company Details */}
              {currentStep === 1 && (
                <>
                  <div className="mt-10">
                    <h2 className="text-lg font-semibold text-white">Company Details</h2>
                    <p className="mt-1 text-sm text-white/70">
                      Provide your business details as per official registration.
                    </p>
                  </div>
                  <form onSubmit={handleContinue} className="mt-6 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="companyName" className="text-sm font-medium text-white">
                          Company / Builder Name (required)
                        </Label>
                        <input
                          id="companyName"
                          type="text"
                          placeholder="e.g. ABC Constructions Pvt Ltd"
                          value={kycData.companyName}
                          onChange={(e) => setKycData((d) => ({ ...d, companyName: e.target.value }))}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                        {errors.companyName && <p className="text-sm text-red-300">{errors.companyName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessType" className="text-sm font-medium text-white">Business Type</Label>
                        <div className="relative">
                          <select
                            id="businessType"
                            value={kycData.businessType}
                            onChange={(e) => setKycData((d) => ({ ...d, businessType: e.target.value }))}
                            className={inputClass}
                            style={{ ...inputStyle, appearance: "none" }}
                            onFocus={(e) => onFocus(e, true)}
                            onBlur={(e) => onFocus(e, false)}
                          >
                            <option
                              value=""
                              style={{ backgroundColor: "#0F172A", color: "#E2E8F0" }}
                            >
                              Select type
                            </option>
                            {BUSINESS_TYPES.map((opt) => (
                              <option
                                key={opt.value}
                                value={opt.value}
                                style={{ backgroundColor: "#0F172A", color: "#FFFFFF" }}
                              >
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none text-gray-400" />
                        </div>
                        {errors.businessType && <p className="text-sm text-red-300">{errors.businessType}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yearOfEstablishment" className="text-sm font-medium text-white">Year of Establishment</Label>
                        <input
                          id="yearOfEstablishment"
                          type="text"
                          placeholder="e.g. 2015"
                          value={kycData.yearOfEstablishment}
                          onChange={(e) => setKycData((d) => ({ ...d, yearOfEstablishment: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                        {errors.yearOfEstablishment && <p className="text-sm text-red-300">{errors.yearOfEstablishment}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyPan" className="text-sm font-medium text-white">Company PAN</Label>
                        <div className="relative">
                          <input
                            id="companyPan"
                            type="text"
                            placeholder="ABCDE1234F"
                            value={kycData.companyPan}
                            onChange={(e) => handlePanChange(e.target.value, "company")}
                            maxLength={10}
                            className={`${inputClass} pr-12`}
                            style={inputStyle}
                            onFocus={(e) => onFocus(e, true)}
                            onBlur={(e) => onFocus(e, false)}
                          />
                          <Lock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        </div>
                        {errors.companyPan && <p className="text-sm text-red-300">{errors.companyPan}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstNumber" className="text-sm font-medium text-white">GST Number (optional)</Label>
                        <input
                          id="gstNumber"
                          type="text"
                          placeholder="e.g. 27AABCU9603R1ZM"
                          value={kycData.gstNumber}
                          onChange={(e) => setKycData((d) => ({ ...d, gstNumber: e.target.value }))}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="officialEmail" className="text-sm font-medium text-white">Official Email Address</Label>
                        <input
                          id="officialEmail"
                          type="email"
                          placeholder="contact@company.com"
                          value={kycData.officialEmail}
                          onChange={(e) => setKycData((d) => ({ ...d, officialEmail: e.target.value }))}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                        {errors.officialEmail && <p className="text-sm text-red-300">{errors.officialEmail}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="officialMobile" className="text-sm font-medium text-white">Official Mobile Number (OTP verified – mock)</Label>
                        <div className="relative">
                          <input
                            id="officialMobile"
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={kycData.officialMobile}
                            onChange={(e) => setKycData((d) => ({ ...d, officialMobile: e.target.value }))}
                            className={`${inputClass} ${officialMobileVerified ? "pr-28" : ""}`}
                            style={inputStyle}
                            onFocus={(e) => onFocus(e, true)}
                            onBlur={(e) => onFocus(e, false)}
                          />
                          {officialMobileVerified && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-xs font-medium text-white bg-green-600">
                              OTP VERIFIED
                            </span>
                          )}
                        </div>
                        {errors.officialMobile && <p className="text-sm text-red-300">{errors.officialMobile}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-6 pt-4 sm:flex-row sm:items-center sm:justify-end">
                      <div className="hidden sm:block sm:flex-1" />
                      <button type="submit" className={primaryBtnClass} style={primaryBtnStyle}>
                        Continue to Step 2
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Step 2: Business Address */}
              {currentStep === 2 && (
                <>
                  <div className="mt-10">
                    <h2 className="text-lg font-semibold text-white">Business Address</h2>
                    <p className="mt-1 text-sm text-white/70">
                      Registered address of your business.
                    </p>
                  </div>
                  <form onSubmit={handleContinue} className="mt-6 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="addressLine1" className="text-sm font-medium text-white">Registered Address Line 1</Label>
                        <input
                          id="addressLine1"
                          type="text"
                          placeholder="Building / Plot number, Street"
                          value={kycData.addressLine1}
                          onChange={(e) => setKycData((d) => ({ ...d, addressLine1: e.target.value }))}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                        {errors.addressLine1 && <p className="text-sm text-red-300">{errors.addressLine1}</p>}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="addressLine2" className="text-sm font-medium text-white">Address Line 2</Label>
                        <input
                          id="addressLine2"
                          type="text"
                          placeholder="Area, Landmark"
                          value={kycData.addressLine2}
                          onChange={(e) => setKycData((d) => ({ ...d, addressLine2: e.target.value }))}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium text-white">City</Label>
                        <input
                          id="city"
                          type="text"
                          placeholder="e.g. Mumbai"
                          value={kycData.city}
                          onChange={(e) => setKycData((d) => ({ ...d, city: e.target.value }))}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                        {errors.city && <p className="text-sm text-red-300">{errors.city}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-medium text-white">State</Label>
                        <div className="relative">
                          <select
                            id="state"
                            value={kycData.state}
                            onChange={(e) => setKycData((d) => ({ ...d, state: e.target.value }))}
                            className={inputClass}
                            style={{ ...inputStyle, appearance: "none" }}
                            onFocus={(e) => onFocus(e, true)}
                            onBlur={(e) => onFocus(e, false)}
                          >
                            <option
                              value=""
                              style={{ backgroundColor: "#0F172A", color: "#E2E8F0" }}
                            >
                              Select State
                            </option>
                            {INDIAN_STATES.map((s) => (
                              <option
                                key={s}
                                value={s}
                                style={{ backgroundColor: "#0F172A", color: "#FFFFFF" }}
                              >
                                {s}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none text-gray-400" />
                        </div>
                        {errors.state && <p className="text-sm text-red-300">{errors.state}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode" className="text-sm font-medium text-white">Pincode</Label>
                        <input
                          id="pincode"
                          type="text"
                          inputMode="numeric"
                          placeholder="6 digits"
                          value={kycData.pincode}
                          onChange={(e) => handlePincodeChange(e.target.value)}
                          maxLength={6}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                        {errors.pincode && <p className="text-sm text-red-300">{errors.pincode}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm font-medium text-white">Country</Label>
                        <input
                          id="country"
                          type="text"
                          value={kycData.country}
                          disabled
                          className={inputClass}
                          style={{ ...inputStyle, opacity: 0.8, cursor: "not-allowed" }}
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <input
                        id="sameAsSiteOffice"
                        type="checkbox"
                        checked={kycData.sameAsSiteOffice}
                        onChange={(e) => setKycData((d) => ({ ...d, sameAsSiteOffice: e.target.checked }))}
                        className="mt-1 h-4 w-4 rounded border-2 border-white/20"
                        style={{ accentColor: "#2563EB" }}
                      />
                      <Label htmlFor="sameAsSiteOffice" className="cursor-pointer text-sm font-normal text-white/70">
                        Same as site office address
                      </Label>
                    </div>
                    <div className="flex flex-col gap-6 pt-4 sm:flex-row sm:items-center sm:justify-end">
                      <button type="button" onClick={handleBack} className={secondaryBtnClass} style={secondaryBtnStyle}>
                        Back
                      </button>
                      <button type="submit" className={primaryBtnClass} style={primaryBtnStyle}>
                        Continue to Step 3
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Step 3: Legal & Registration Documents */}
              {currentStep === 3 && (
                <>
                  <div className="mt-10">
                    <h2 className="text-lg font-semibold text-white">Legal & Registration Documents</h2>
                    <p className="mt-1 text-sm text-white/70">
                      Upload required documents (mock upload – DEV mode).
                    </p>
                  </div>
                  <form onSubmit={handleContinue} className="mt-6 space-y-5">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-white">Company PAN Card</Label>
                        <div className="flex items-center gap-3">
                          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 px-4 text-sm font-medium text-white hover:bg-white/15">
                            <Upload className="h-4 w-4" />
                            Choose file
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => handleMockFileUpload(e, "companyPanFile")}
                            />
                          </label>
                          {kycData.companyPanFile && <span className="text-sm text-[#16A34A]">{kycData.companyPanFile}</span>}
                        </div>
                        {errors.companyPanFile && <p className="text-sm text-red-300">{errors.companyPanFile}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-white">GST Certificate</Label>
                        <div className="flex items-center gap-3">
                          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 px-4 text-sm font-medium text-white hover:bg-white/15">
                            <Upload className="h-4 w-4" />
                            Choose file
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => handleMockFileUpload(e, "gstCertificateFile")}
                            />
                          </label>
                          {kycData.gstCertificateFile && <span className="text-sm text-[#16A34A]">{kycData.gstCertificateFile}</span>}
                        </div>
                        {errors.gstCertificateFile && <p className="text-sm text-red-300">{errors.gstCertificateFile}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-white">CIN / LLPIN (if applicable)</Label>
                        <div className="flex items-center gap-3">
                          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 px-4 text-sm font-medium text-white hover:bg-white/15">
                            <Upload className="h-4 w-4" />
                            Choose file
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => handleMockFileUpload(e, "cinLlpinFile")}
                            />
                          </label>
                          {kycData.cinLlpinFile && <span className="text-sm text-[#16A34A]">{kycData.cinLlpinFile}</span>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reraNumber" className="text-sm font-medium text-white">RERA Registration Number</Label>
                        <input
                          id="reraNumber"
                          type="text"
                          placeholder="e.g. P52100012345"
                          value={kycData.reraNumber}
                          onChange={(e) => setKycData((d) => ({ ...d, reraNumber: e.target.value }))}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-white">RERA Certificate Upload</Label>
                        <div className="flex items-center gap-3">
                          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 px-4 text-sm font-medium text-white hover:bg-white/15">
                            <Upload className="h-4 w-4" />
                            Choose file
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => handleMockFileUpload(e, "reraCertificateFile")}
                            />
                          </label>
                          {kycData.reraCertificateFile && <span className="text-sm text-[#16A34A]">{kycData.reraCertificateFile}</span>}
                        </div>
                        {errors.reraCertificateFile && <p className="text-sm text-red-300">{errors.reraCertificateFile}</p>}
                      </div>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-white/70">
                      <Lock className="h-3.5 w-3.5 text-[#2563EB]" />
                      All documents are encrypted and securely stored.
                    </p>
                    <div className="flex flex-col gap-6 pt-4 sm:flex-row sm:items-center sm:justify-end">
                      <button type="button" onClick={handleBack} className={secondaryBtnClass} style={secondaryBtnStyle}>
                        Back
                      </button>
                      <button type="submit" className={primaryBtnClass} style={primaryBtnStyle}>
                        Continue to Step 4
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Step 4: Bank Account Details */}
              {currentStep === 4 && (
                <>
                  <div className="mt-10">
                    <h2 className="text-lg font-semibold text-white">Bank Account Details</h2>
                    <p className="mt-1 text-sm text-white/70">
                      Bank account for receiving payments.
                    </p>
                  </div>
                  <form onSubmit={handleContinue} className="mt-6 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="accountHolderName" className="text-sm font-medium text-white">Account Holder Name</Label>
                        <input
                          id="accountHolderName"
                          type="text"
                          placeholder="As per bank record"
                          value={kycData.accountHolderName}
                          onChange={(e) => setKycData((d) => ({ ...d, accountHolderName: e.target.value }))}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                        {errors.accountHolderName && <p className="text-sm text-red-300">{errors.accountHolderName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankName" className="text-sm font-medium text-white">Bank Name</Label>
                        <input
                          id="bankName"
                          type="text"
                          placeholder="e.g. State Bank of India"
                          value={kycData.bankName}
                          onChange={(e) => setKycData((d) => ({ ...d, bankName: e.target.value }))}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                        {errors.bankName && <p className="text-sm text-red-300">{errors.bankName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber" className="text-sm font-medium text-white">Account Number</Label>
                        <input
                          id="accountNumber"
                          type="text"
                          inputMode="numeric"
                          placeholder="Account number"
                          value={kycData.accountNumber}
                          onChange={(e) => setKycData((d) => ({ ...d, accountNumber: e.target.value.replace(/\D/g, "") }))}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                        {errors.accountNumber && <p className="text-sm text-red-300">{errors.accountNumber}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ifscCode" className="text-sm font-medium text-white">IFSC Code</Label>
                        <input
                          id="ifscCode"
                          type="text"
                          placeholder="e.g. SBIN0001234"
                          value={kycData.ifscCode}
                          onChange={(e) => handleIfscChange(e.target.value)}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                        {errors.ifscCode && <p className="text-sm text-red-300">{errors.ifscCode}</p>}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-sm font-medium text-white">Cancelled Cheque Upload</Label>
                        <div className="flex items-center gap-3">
                          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 px-4 text-sm font-medium text-white hover:bg-white/15">
                            <Upload className="h-4 w-4" />
                            Choose file
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => handleMockFileUpload(e, "cancelledChequeFile")}
                            />
                          </label>
                          {kycData.cancelledChequeFile && <span className="text-sm text-[#16A34A]">{kycData.cancelledChequeFile}</span>}
                        </div>
                        {errors.cancelledChequeFile && <p className="text-sm text-red-300">{errors.cancelledChequeFile}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-6 pt-4 sm:flex-row sm:items-center sm:justify-end">
                      <button type="button" onClick={handleBack} className={secondaryBtnClass} style={secondaryBtnStyle}>
                        Back
                      </button>
                      <button type="submit" className={primaryBtnClass} style={primaryBtnStyle}>
                        Continue to Step 5
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Step 5: Authorized Person Verification */}
              {currentStep === 5 && (
                <>
                  <div className="mt-10">
                    <h2 className="text-lg font-semibold text-white">Authorized Person Verification</h2>
                    <p className="mt-1 text-sm text-white/70">
                      Details of the authorized signatory.
                    </p>
                  </div>
                  <form onSubmit={handleContinue} className="mt-6 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="authPersonName" className="text-sm font-medium text-white">Full Name (Authorized Signatory)</Label>
                        <input
                          id="authPersonName"
                          type="text"
                          placeholder="As per ID"
                          value={kycData.authPersonName}
                          onChange={(e) => setKycData((d) => ({ ...d, authPersonName: e.target.value }))}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                        {errors.authPersonName && <p className="text-sm text-red-300">{errors.authPersonName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="designation" className="text-sm font-medium text-white">Designation</Label>
                        <input
                          id="designation"
                          type="text"
                          placeholder="e.g. Director"
                          value={kycData.designation}
                          onChange={(e) => setKycData((d) => ({ ...d, designation: e.target.value }))}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                        {errors.designation && <p className="text-sm text-red-300">{errors.designation}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="authPersonMobile" className="text-sm font-medium text-white">Mobile Number (OTP verified – mock)</Label>
                        <div className="relative">
                          <input
                            id="authPersonMobile"
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={kycData.authPersonMobile}
                            onChange={(e) => setKycData((d) => ({ ...d, authPersonMobile: e.target.value }))}
                            className={`${inputClass} ${authMobileVerified ? "pr-28" : ""}`}
                            style={inputStyle}
                            onFocus={(e) => onFocus(e, true)}
                            onBlur={(e) => onFocus(e, false)}
                          />
                          {authMobileVerified && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-xs font-medium text-white bg-green-600">
                              OTP VERIFIED
                            </span>
                          )}
                        </div>
                        {errors.authPersonMobile && <p className="text-sm text-red-300">{errors.authPersonMobile}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="authPersonEmail" className="text-sm font-medium text-white">Email Address</Label>
                        <input
                          id="authPersonEmail"
                          type="email"
                          placeholder="email@example.com"
                          value={kycData.authPersonEmail}
                          onChange={(e) => setKycData((d) => ({ ...d, authPersonEmail: e.target.value }))}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                        {errors.authPersonEmail && <p className="text-sm text-red-300">{errors.authPersonEmail}</p>}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="authPersonPan" className="text-sm font-medium text-white">PAN Number</Label>
                        <input
                          id="authPersonPan"
                          type="text"
                          placeholder="ABCDE1234F"
                          value={kycData.authPersonPan}
                          onChange={(e) => handlePanChange(e.target.value, "auth")}
                          maxLength={10}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={(e) => onFocus(e, true)}
                          onBlur={(e) => onFocus(e, false)}
                        />
                        {errors.authPersonPan && <p className="text-sm text-red-300">{errors.authPersonPan}</p>}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-sm font-medium text-white">ID Proof Upload (Aadhaar / Passport / Driving License)</Label>
                        <div className="flex items-center gap-3">
                          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 px-4 text-sm font-medium text-white hover:bg-white/15">
                            <Upload className="h-4 w-4" />
                            Choose file
                            <input
                              type="file"
                              name="documentImage"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => handleMockFileUpload(e, "idProofFile")}
                            />
                          </label>
                          {kycData.idProofFile && <span className="text-sm text-[#16A34A]">{kycData.idProofFile}</span>}
                        </div>
                        {errors.idProofFile && <p className="text-sm text-red-300">{errors.idProofFile}</p>}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-sm font-medium text-white">Selfie with ID (optional – mock)</Label>
                        <div className="flex items-center gap-3">
                          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 px-4 text-sm font-medium text-white hover:bg-white/15">
                            <Upload className="h-4 w-4" />
                            Choose file
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => handleMockFileUpload(e, "selfieWithIdFile")}
                            />
                          </label>
                          {kycData.selfieWithIdFile && <span className="text-sm text-[#16A34A]">{kycData.selfieWithIdFile}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-6 pt-4 sm:flex-row sm:items-center sm:justify-end">
                      <button type="button" onClick={handleBack} className={secondaryBtnClass} style={secondaryBtnStyle}>
                        Back
                      </button>
                      <button type="submit" className={primaryBtnClass} style={primaryBtnStyle}>
                        Continue to Step 6
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Step 6: Review & Submit */}
              {currentStep === 6 && (
                <>
                  <div className="mt-10">
                    <h2 className="text-lg font-semibold text-white">Review & Submit</h2>
                    <p className="mt-1 text-sm text-white/70">
                      Review your details before submitting for verification.
                    </p>
                  </div>
                  <div className="mt-6 space-y-5">
                    {/* Company Details */}
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-base font-semibold text-white">Company Details</h3>
                        <button type="button" onClick={() => setCurrentStep(1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:opacity-90">
                          Edit <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                        <div><dt className="font-medium text-white/70">Company Name</dt><dd className="text-white">{kycData.companyName || "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">Business Type</dt><dd className="text-white">{BUSINESS_TYPES.find((t) => t.value === kycData.businessType)?.label ?? "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">Year of Establishment</dt><dd className="text-white">{kycData.yearOfEstablishment || "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">Company PAN</dt><dd className="text-white">{kycData.companyPan ? maskPan(kycData.companyPan) : "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">Official Email</dt><dd className="text-white">{kycData.officialEmail || "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">Official Mobile</dt><dd className="text-white">{kycData.officialMobile || "—"}</dd></div>
                      </dl>
                    </div>
                    {/* Address */}
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-base font-semibold text-white">Address</h3>
                        <button type="button" onClick={() => setCurrentStep(2)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:opacity-90">
                          Edit <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <dl className="mt-4 space-y-2 text-sm">
                        <div><dt className="font-medium text-white/70">Registered Address</dt><dd className="text-white">{[kycData.addressLine1, kycData.addressLine2].filter(Boolean).join(", ") || "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">City, State, Country</dt><dd className="text-white">{[kycData.city, kycData.state, kycData.country].filter(Boolean).join(", ") || "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">Pincode</dt><dd className="text-white">{kycData.pincode || "—"}</dd></div>
                        {kycData.sameAsSiteOffice && <div><dt className="font-medium text-white/70">Site office</dt><dd className="text-white">Same as registered address</dd></div>}
                      </dl>
                    </div>
                    {/* Documents */}
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-base font-semibold text-white">Documents</h3>
                        <button type="button" onClick={() => setCurrentStep(3)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:opacity-90">
                          Edit <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <dl className="mt-4 space-y-2 text-sm">
                        <div><dt className="font-medium text-white/70">Company PAN Card</dt><dd className="text-white">{kycData.companyPanFile || "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">GST Certificate</dt><dd className="text-white">{kycData.gstCertificateFile || "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">RERA Number</dt><dd className="text-white">{kycData.reraNumber || "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">RERA Certificate</dt><dd className="text-white">{kycData.reraCertificateFile || "—"}</dd></div>
                      </dl>
                    </div>
                    {/* Bank Info */}
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-base font-semibold text-white">Bank Info</h3>
                        <button type="button" onClick={() => setCurrentStep(4)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:opacity-90">
                          Edit <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                        <div><dt className="font-medium text-white/70">Account Holder</dt><dd className="text-white">{kycData.accountHolderName || "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">Bank Name</dt><dd className="text-white">{kycData.bankName || "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">Account Number</dt><dd className="text-white">{kycData.accountNumber ? "****" + maskAccountLast4(kycData.accountNumber) : "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">IFSC</dt><dd className="text-white">{kycData.ifscCode || "—"}</dd></div>
                      </dl>
                    </div>
                    {/* Authorized Person */}
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-base font-semibold text-white">Authorized Person</h3>
                        <button type="button" onClick={() => setCurrentStep(5)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:opacity-90">
                          Edit <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                        <div><dt className="font-medium text-white/70">Name</dt><dd className="text-white">{kycData.authPersonName || "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">Designation</dt><dd className="text-white">{kycData.designation || "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">Mobile</dt><dd className="text-white">{kycData.authPersonMobile || "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">Email</dt><dd className="text-white">{kycData.authPersonEmail || "—"}</dd></div>
                        <div><dt className="font-medium text-white/70">PAN</dt><dd className="text-white">{kycData.authPersonPan ? maskPan(kycData.authPersonPan) : "—"}</dd></div>
                      </dl>
                    </div>
                    {/* Declaration */}
                    <div className="rounded-2xl border border-white/20 p-5">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={declarationAccepted}
                          onChange={(e) => { setDeclarationAccepted(e.target.checked); setErrors((err) => ({ ...err, declaration: "" })); }}
                          className="mt-1 h-4 w-4 rounded border-gray-300"
                          style={{ accentColor: "#2563EB" }}
                        />
                        <span className="text-sm text-white">
                          I confirm that the information provided is true and correct to the best of my knowledge.
                        </span>
                      </label>
                      <p className="mt-2 text-xs text-white/70">Providing false information may result in account suspension.</p>
                      {errors.declaration && <p className="mt-1 text-sm text-red-300">{errors.declaration}</p>}
                    </div>
                    <div className="flex flex-col gap-6 pt-4 sm:flex-row sm:items-center sm:justify-end">
                      <button type="button" onClick={handleBack} className={secondaryBtnClass} style={secondaryBtnStyle}>
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleContinue(e as unknown as React.FormEvent)}
                        disabled={!declarationAccepted || isSubmittingKyc}
                        className={`${primaryBtnClass} disabled:opacity-50`}
                        style={primaryBtnStyle}
                      >
                        {isSubmittingKyc ? "Submitting…" : "Submit KYC"}
                      </button>
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}


