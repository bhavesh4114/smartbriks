import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { investorMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { User, Mail, Phone, MapPin, CreditCard, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { formatINR } from "../../utils/currency";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type KycDoc = {
  id: number;
  documentType: string;
  documentNumber?: string | null;
  documentImage?: string | null;
  status: string;
  createdAt: string | Date;
  verifiedAt?: string | Date | null;
  rejectionReason?: string | null;
};

type InvestorProfileData = {
  user: {
    id: number;
    fullName: string;
    email: string;
    mobileNumber: string;
    createdAt: string | Date;
    kycStatus: string;
    isActive: boolean;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    pincode?: string;
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    routingNumber?: string;
    ifscCode?: string;
    swiftCode?: string;
  };
  profile?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    zipCode?: string;
    pincode?: string;
    bankName?: string;
    accountHolder?: string;
    accountHolderName?: string;
    accountNumber?: string;
    routing?: string;
    routingNumber?: string;
    ifscCode?: string;
    swift?: string;
    swiftCode?: string;
  };
  bankDetails?: {
    bankName?: string;
    accountHolder?: string;
    accountHolderName?: string;
    accountNumber?: string;
    routing?: string;
    routingNumber?: string;
    ifscCode?: string;
    swift?: string;
    swiftCode?: string;
  };
  stats: {
    total_investments: number | string;
    active_projects: number;
  };
  wallet?: {
    id: number;
    balance: number | string;
  };
  kyc_documents: KycDoc[];
};

const prettyDocLabel = (type: string) => {
  const map: Record<string, string> = {
    KYC_SUBMISSION: "KYC Submission",
    INVESTOR_PAN_CARD: "PAN Card",
    INVESTOR_AADHAAR_CARD: "Aadhaar Card",
    BANK_PROOF: "Bank Proof",
    INVESTOR_SELFIE: "Selfie",
  };
  return map[type] || type.replace(/_/g, " ");
};

export default function InvestorProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<InvestorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [personalFeedback, setPersonalFeedback] = useState("");
  const [bankFeedback, setBankFeedback] = useState("");
  const [securityFeedback, setSecurityFeedback] = useState("");
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [addingMoney, setAddingMoney] = useState(false);
  const [walletFeedback, setWalletFeedback] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    routing: "",
    swift: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const pickFirst = (...values: Array<string | null | undefined>) =>
    values.find((v) => typeof v === "string" && v.trim().length > 0)?.trim() ?? "";

  const fillFormFromProfile = (nextProfile: InvestorProfileData) => {
    const [firstName, ...rest] = (nextProfile.user.fullName || "").split(" ");
    setForm({
      firstName: firstName || "",
      lastName: rest.join(" ") || "",
      email: nextProfile.user.email || "",
      phone: nextProfile.user.mobileNumber || "",
      address: pickFirst(nextProfile.profile?.address, nextProfile.user.address),
      city: pickFirst(nextProfile.profile?.city, nextProfile.user.city),
      state: pickFirst(nextProfile.profile?.state, nextProfile.user.state),
      zip: pickFirst(
        nextProfile.profile?.zip,
        nextProfile.profile?.zipCode,
        nextProfile.profile?.pincode,
        nextProfile.user.zipCode,
        nextProfile.user.pincode
      ),
      bankName: pickFirst(nextProfile.bankDetails?.bankName, nextProfile.profile?.bankName, nextProfile.user.bankName),
      accountHolder: pickFirst(
        nextProfile.bankDetails?.accountHolder,
        nextProfile.bankDetails?.accountHolderName,
        nextProfile.profile?.accountHolder,
        nextProfile.profile?.accountHolderName,
        nextProfile.user.accountHolderName
      ),
      accountNumber: pickFirst(
        nextProfile.bankDetails?.accountNumber,
        nextProfile.profile?.accountNumber,
        nextProfile.user.accountNumber
      ),
      routing: pickFirst(
        nextProfile.bankDetails?.routing,
        nextProfile.bankDetails?.routingNumber,
        nextProfile.bankDetails?.ifscCode,
        nextProfile.profile?.routing,
        nextProfile.profile?.routingNumber,
        nextProfile.profile?.ifscCode,
        nextProfile.user.routingNumber,
        nextProfile.user.ifscCode
      ),
      swift: pickFirst(
        nextProfile.bankDetails?.swift,
        nextProfile.bankDetails?.swiftCode,
        nextProfile.profile?.swift,
        nextProfile.profile?.swiftCode,
        nextProfile.user.swiftCode
      ),
    });
  };

  const fetchProfile = async (showLoader = true) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/investor/login", { replace: true });
      return null;
    }
    if (showLoader) setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/investor/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        navigate("/investor/login", { replace: true });
        return null;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setError(data?.message || "You are not allowed to access this profile.");
        setProfile(null);
        return null;
      }
      if (!res.ok || !data?.success || !data?.data) {
        setError(data?.message || "Failed to load profile.");
        setProfile(null);
        return null;
      }
      const nextProfile = data.data as InvestorProfileData;
      setProfile(nextProfile);
      fillFormFromProfile(nextProfile);
      return nextProfile;
    } catch {
      setError("Network error while loading profile.");
      setProfile(null);
      return null;
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

  const requestWithFallback = async (
    candidates: Array<{ url: string; method: "PATCH" | "PUT" | "POST" }>,
    payloads: Array<Record<string, unknown>>
  ) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/investor/login", { replace: true });
      return { ok: false, message: "Session expired. Please login again." };
    }

    let latestMessage = "Failed to save changes. Please check backend profile update API.";

    for (const payload of payloads) {
      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate.url, {
            method: candidate.method,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          if (res.status === 401) {
            navigate("/investor/login", { replace: true });
            return { ok: false, message: "Session expired. Please login again." };
          }

          const raw = await res.text();
          let data: any = {};
          if (raw) {
            try {
              data = JSON.parse(raw);
            } catch {
              data = { message: raw };
            }
          }

          if (res.ok && data?.success !== false) {
            return { ok: true, message: data?.message || "Changes saved successfully." };
          }
          if (res.status !== 404 && res.status !== 405) {
            latestMessage = data?.message || latestMessage;
          }
        } catch {
          latestMessage = "Network error while saving changes.";
        }
      }
    }

    return { ok: false, message: latestMessage };
  };

  const loadRazorpayScript = async () => {
    if (window.Razorpay) return true;
    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAddMoney = async () => {
    setWalletFeedback("");
    const amount = Number(addMoneyAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setWalletFeedback("Enter a valid amount.");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/investor/login", { replace: true });
      return;
    }

    setAddingMoney(true);
    try {
      const res = await fetch("/api/investor/add-money", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setWalletFeedback(data?.message || "Failed to create top-up request.");
        return;
      }

      if (data?.data?.mode === "mock") {
        setWalletFeedback("Wallet top-up successful.");
        setAddMoneyAmount("");
        await fetchProfile(false);
        return;
      }

      const orderData = data?.data || {};
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setWalletFeedback("Unable to load payment gateway.");
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "SmartBrick",
        description: "Wallet Top-up",
        order_id: orderData.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/investor/add-money/verify", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json().catch(() => ({}));
          if (!verifyRes.ok || verifyData?.success === false) {
            setWalletFeedback(verifyData?.message || "Payment verification failed.");
            return;
          }
          setWalletFeedback("Wallet top-up successful.");
          setAddMoneyAmount("");
          setAddMoneyOpen(false);
          await fetchProfile(false);
        },
        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        const message = response?.error?.description || "Payment failed.";
        setWalletFeedback(message);
      });
      rzp.open();
    } catch {
      setWalletFeedback("Network error while adding money.");
    } finally {
      setAddingMoney(false);
    }
  };

  const handlePersonalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalFeedback("");

    if (!form.firstName.trim() || !form.email.trim() || !form.phone.trim()) {
      setPersonalFeedback("First name, email and phone are required.");
      return;
    }

    setSavingPersonal(true);
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      fullName,
      email: form.email.trim(),
      mobileNumber: form.phone.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zipCode: form.zip.trim(),
      pincode: form.zip.trim(),
    };

    const result = await requestWithFallback(
      [
        { url: "/api/investor/profile", method: "PATCH" },
        { url: "/api/investor/profile", method: "PUT" },
        { url: "/api/investor/profile/personal", method: "PATCH" },
        { url: "/api/investor/profile/personal", method: "PUT" },
        { url: "/api/investor/profile/update", method: "POST" },
      ],
      [
        payload,
        {
          fullName,
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zipCode: form.zip.trim(),
        },
        {
          personalDetails: payload,
        },
      ]
    );

    setPersonalFeedback(result.message);
    if (result.ok) await fetchProfile(false);
    setSavingPersonal(false);
  };

  const handleBankSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankFeedback("");

    if (!form.bankName.trim() || !form.accountHolder.trim() || !form.accountNumber.trim()) {
      setBankFeedback("Bank name, account holder and account number are required.");
      return;
    }

    setSavingBank(true);
    const payload = {
      bankName: form.bankName.trim(),
      accountHolder: form.accountHolder.trim(),
      accountHolderName: form.accountHolder.trim(),
      accountNumber: form.accountNumber.trim(),
      routing: form.routing.trim(),
      routingNumber: form.routing.trim(),
      ifscCode: form.routing.trim(),
      swift: form.swift.trim(),
      swiftCode: form.swift.trim(),
    };

    const result = await requestWithFallback(
      [
        { url: "/api/investor/profile/bank", method: "PATCH" },
        { url: "/api/investor/profile/bank", method: "PUT" },
        { url: "/api/investor/profile", method: "PATCH" },
        { url: "/api/investor/bank-details", method: "PATCH" },
        { url: "/api/investor/bank-details", method: "PUT" },
        { url: "/api/investor/profile/update-bank", method: "POST" },
      ],
      [
        payload,
        {
          bankDetails: payload,
        },
      ]
    );

    setBankFeedback(result.message);
    if (result.ok) await fetchProfile(false);
    setSavingBank(false);
  };

  const handlePasswordSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSecurityFeedback("");

    const formData = new FormData(e.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? passwordForm.currentPassword).trim();
    const newPassword = String(formData.get("newPassword") ?? passwordForm.newPassword).trim();
    const confirmPassword = String(formData.get("confirmPassword") ?? passwordForm.confirmPassword).trim();

    setPasswordForm({ currentPassword, newPassword, confirmPassword });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityFeedback("All password fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setSecurityFeedback("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityFeedback("New password and confirm password do not match.");
      return;
    }

    setSavingSecurity(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        navigate("/investor/login", { replace: true });
        return;
      }

      const res = await fetch("/api/investor/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
          oldPassword: currentPassword,
        }),
      });

      if (res.status === 401) {
        navigate("/investor/login", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));
      setSecurityFeedback(data?.message || (res.ok ? "Password updated successfully." : "Failed to update password."));

      if (res.ok && data?.success !== false) {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setShowPasswords({ current: false, next: false, confirm: false });
      }
    } catch {
      setSecurityFeedback("Network error while updating password.");
    } finally {
      setSavingSecurity(false);
    }

  };

  const memberSince = useMemo(() => {
    const d = new Date(profile?.user?.createdAt || "");
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [profile?.user?.createdAt]);

  const kycStatusLabel = (status?: string) => {
    if (!status) return "Unknown";
    if (status === "VERIFIED") return "Verified";
    if (status === "PENDING") return "Pending";
    if (status === "REJECTED") return "Rejected";
    return status;
  };

  const kycStatusClass = (status?: string) => {
    if (status === "VERIFIED") return "bg-emerald-50 text-green-600 border-0";
    if (status === "PENDING") return "bg-amber-50 text-amber-700 border-0";
    if (status === "REJECTED") return "bg-red-50 text-red-600 border-0";
    return "bg-slate-100 text-slate-600 border-0";
  };

  const toShortDate = (value: string | Date) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <DashboardLayout
      sidebarItems={investorMenuItems}
      userName={profile?.user?.fullName || "Investor"}
      userRole="Investor"
      logoText="RealEstate"
    >
      <div className="min-w-0 space-y-5 sm:space-y-6">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-gray-900 sm:text-3xl">My Profile</h1>
          <p className="text-gray-500">Manage your personal information and settings</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        {/* Profile Header */}
        <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-gray-200 bg-blue-600 text-white text-3xl font-semibold">
                {(profile?.user?.fullName || "I").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h2 className="break-words text-xl font-semibold text-gray-900 sm:text-2xl">
                    {profile?.user?.fullName || (loading ? "Loading..." : "Investor")}
                  </h2>
                  <Badge className={kycStatusClass(profile?.user?.kycStatus)}>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {kycStatusLabel(profile?.user?.kycStatus)}
                  </Badge>
                </div>
                <p className="mt-1 text-gray-500">{profile?.user?.email || "--"}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium text-gray-900">{memberSince}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Investments</p>
                    <p className="font-medium text-gray-900">
                      {formatINR(profile?.stats?.total_investments ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Projects</p>
                    <p className="font-medium text-gray-900">{profile?.stats?.active_projects ?? 0} Projects</p>
                  </div>
                </div>
              </div>
              <div className="w-full space-y-3 sm:w-auto">
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm">
                  <p className="text-blue-700">Wallet Balance</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {formatINR(profile?.wallet?.balance ?? 0)}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setAddMoneyOpen(true)}
                  className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                >
                  Add Money
                </Button>
                <Button className="w-full rounded-xl bg-slate-800 text-white hover:bg-slate-900 sm:w-auto">
                  Edit Profile Photo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={addMoneyOpen} onOpenChange={setAddMoneyOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Money to Wallet</DialogTitle>
              <DialogDescription>
                Enter an amount to top-up your wallet before investing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="addMoneyAmount">Amount (INR)</Label>
              <Input
                id="addMoneyAmount"
                type="number"
                min={1}
                value={addMoneyAmount}
                onChange={(e) => setAddMoneyAmount(e.target.value)}
                placeholder="e.g. 5000"
              />
              {walletFeedback && (
                <p className={`text-sm ${walletFeedback.toLowerCase().includes("successful") ? "text-emerald-600" : "text-red-600"}`}>
                  {walletFeedback}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddMoneyOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={addingMoney} onClick={handleAddMoney}>
                {addingMoney ? "Processing..." : "Pay Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profile Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="w-full justify-start gap-1 overflow-x-auto whitespace-nowrap bg-gray-100 border border-gray-200 p-1 rounded-xl">
            <TabsTrigger value="personal" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg">Personal Details</TabsTrigger>
            <TabsTrigger value="bank" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg">Bank Details</TabsTrigger>
            <TabsTrigger value="kyc" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg">KYC Status</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg">Security</TabsTrigger>
          </TabsList>

          {/* Personal Details Tab */}
          <TabsContent value="personal">
            <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handlePersonalSave}>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="firstName"
                          value={form.firstName}
                          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="lastName"
                          value={form.lastName}
                          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          value={form.phone}
                          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="address"
                        value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input id="zip" value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} />
                    </div>
                  </div>

                  {personalFeedback && (
                    <p className={`text-sm ${personalFeedback.includes("success") || personalFeedback.includes("saved") ? "text-emerald-600" : "text-red-600"}`}>
                      {personalFeedback}
                    </p>
                  )}

                  <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-gray-200 text-gray-700 hover:bg-slate-50 sm:w-auto"
                      onClick={() => profile && fillFormFromProfile(profile)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={savingPersonal}
                      className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                    >
                      {savingPersonal ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Details Tab */}
          <TabsContent value="bank">
            <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Bank Account Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleBankSave}>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input id="bankName" value={form.bankName} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountHolder">Account Holder Name</Label>
                      <Input id="accountHolder" value={form.accountHolder} onChange={(e) => setForm((f) => ({ ...f, accountHolder: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="accountNumber"
                          value={form.accountNumber}
                          onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="routing">Routing Number</Label>
                      <Input id="routing" value={form.routing} onChange={(e) => setForm((f) => ({ ...f, routing: e.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="swift">SWIFT/BIC Code</Label>
                    <Input id="swift" value={form.swift} onChange={(e) => setForm((f) => ({ ...f, swift: e.target.value }))} />
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                    <p className="font-medium">Note:</p>
                    <p className="mt-1">
                      All payouts will be transferred to this bank account. Please ensure the
                      details are correct.
                    </p>
                  </div>

                  {bankFeedback && (
                    <p className={`text-sm ${bankFeedback.includes("success") || bankFeedback.includes("saved") ? "text-emerald-600" : "text-red-600"}`}>
                      {bankFeedback}
                    </p>
                  )}

                  <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-gray-200 text-gray-700 hover:bg-slate-50 sm:w-auto"
                      onClick={() => profile && fillFormFromProfile(profile)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={savingBank}
                      className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                    >
                      {savingBank ? "Saving..." : "Update Bank Details"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Status Tab */}
          <TabsContent value="kyc">
            <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">KYC Verification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3 rounded-lg border-2 border-green-500 bg-green-50 p-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{kycStatusLabel(profile?.user?.kycStatus)}</p>
                    <p className="text-sm text-green-700">
                      {profile?.user?.kycStatus === "VERIFIED"
                        ? "Your account is fully verified"
                        : "Your KYC is under review"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Verification Documents</h3>
                  <div className="space-y-3">
                    {(profile?.kyc_documents ?? []).map((doc) => (
                      <div key={doc.id} className="flex flex-col items-start justify-between gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center">
                        <div>
                          <p className="font-medium">{prettyDocLabel(doc.documentType)}</p>
                          <p className="text-sm text-gray-600">
                            Uploaded on {toShortDate(doc.createdAt)}
                          </p>
                        </div>
                        <Badge className={kycStatusClass(doc.status)}>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {kycStatusLabel(doc.status)}
                        </Badge>
                      </div>
                    ))}
                    {!loading && (profile?.kyc_documents?.length ?? 0) === 0 && (
                      <p className="text-sm text-gray-500">No KYC documents submitted yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Verification Expiry</p>
                      <p className="mt-1">
                        Your KYC verification will expire one year after approval. You will be notified before expiry.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handlePasswordSave}>
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        placeholder="Enter current password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                        className="h-11 rounded-xl border-gray-300 bg-white pr-10 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((s) => ({ ...s, current: !s.current }))}
                        className="absolute inset-y-0 right-0 z-10 flex cursor-pointer items-center px-3 text-gray-500 hover:text-gray-700"
                        aria-label={showPasswords.current ? "Hide current password" : "Show current password"}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showPasswords.next ? "text" : "password"}
                          placeholder="Enter new password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                          className="h-11 rounded-xl border-gray-300 bg-white pr-10 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords((s) => ({ ...s, next: !s.next }))}
                          className="absolute inset-y-0 right-0 z-10 flex cursor-pointer items-center px-3 text-gray-500 hover:text-gray-700"
                          aria-label={showPasswords.next ? "Hide new password" : "Show new password"}
                        >
                          {showPasswords.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                          className="h-11 rounded-xl border-gray-300 bg-white pr-10 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords((s) => ({ ...s, confirm: !s.confirm }))}
                          className="absolute inset-y-0 right-0 z-10 flex cursor-pointer items-center px-3 text-gray-500 hover:text-gray-700"
                          aria-label={showPasswords.confirm ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button type="button" variant="outline" className="w-full sm:w-auto">Enable 2FA</Button>
                    </div>
                  </div>

                  {securityFeedback && (
                    <p className={`text-sm ${securityFeedback.includes("success") || securityFeedback.includes("saved") ? "text-emerald-600" : "text-red-600"}`}>
                      {securityFeedback}
                    </p>
                  )}

                  <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-gray-200 text-gray-700 hover:bg-slate-50 sm:w-auto"
                      onClick={() => {
                        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                        setShowPasswords({ current: false, next: false, confirm: false });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={savingSecurity}
                      className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                    >
                      {savingSecurity ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
