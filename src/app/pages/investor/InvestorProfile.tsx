import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { investorMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { User, Mail, Phone, MapPin, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { formatINR } from "../../utils/currency";

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
  };
  stats: {
    total_investments: number | string;
    active_projects: number;
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

  useEffect(() => {
    const fetchProfile = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        navigate("/investor/login", { replace: true });
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/investor/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          navigate("/investor/login", { replace: true });
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          setError(data?.message || "Failed to load profile.");
          setProfile(null);
          return;
        }
        setProfile(data.data as InvestorProfileData);
      } catch {
        setError("Network error while loading profile.");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    if (!profile?.user) return;
    const [firstName, ...rest] = (profile.user.fullName || "").split(" ");
    setForm((f) => ({
      ...f,
      firstName: firstName || "",
      lastName: rest.join(" ") || "",
      email: profile.user.email || "",
      phone: profile.user.mobileNumber || "",
    }));
  }, [profile?.user]);

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
              <Button className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
                Edit Profile Photo
              </Button>
            </div>
          </CardContent>
        </Card>

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
                <form className="space-y-6">
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

                  <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                    <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-slate-50 sm:w-auto">Cancel</Button>
                    <Button className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
                      Save Changes
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
                <form className="space-y-6">
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

                  <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                    <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-slate-50 sm:w-auto">Cancel</Button>
                    <Button className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
                      Update Bank Details
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
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" />
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
                      <Button variant="outline" className="w-full sm:w-auto">Enable 2FA</Button>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                    <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-slate-50 sm:w-auto">Cancel</Button>
                    <Button className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
                      Update Password
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
