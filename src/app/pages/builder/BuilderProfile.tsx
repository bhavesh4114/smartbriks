import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { BuilderLayout } from "../../components/layout/BuilderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Building2, Mail, Phone, MapPin, CreditCard, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { formatINR } from "../../utils/currency";

type BuilderProfilePayload = {
  basic_info: {
    id: number;
    email: string;
    created_at: string;
  };
  company_details: {
    company_name: string;
    registration_number: string | null;
    phone: string | null;
    address: string | null;
  };
  profile_info: {
    logo: string | null;
    verified: boolean;
    member_since: string;
  };
  stats: {
    total_projects: number;
    funds_raised: string;
  };
  bank_information: {
    bank_name: string | null;
    account_holder_name: string | null;
    account_number_masked: string | null;
    routing_or_ifsc: string | null;
  };
};

function formatMonthYear(value?: string | null): string {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(d);
}

function formatCurrency(value?: string | null): string {
  return formatINR(value ?? 0);
}

export default function BuilderProfile() {
  const navigate = useNavigate();
  const [builderProfile, setBuilderProfile] = useState<BuilderProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    registrationNumber: "",
    email: "",
    phone: "",
    address: "",
  });
  const [bankForm, setBankForm] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    routing: "",
  });

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/builder/login", { replace: true });
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const res = await fetch("/api/builder/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          navigate("/builder/login", { replace: true });
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success || !json?.data) {
          setFetchError(json?.message || "Failed to load profile data.");
          return;
        }
        const payload = json.data as BuilderProfilePayload;
        setBuilderProfile(payload);
        setCompanyForm({
          companyName: payload.company_details.company_name || "",
          registrationNumber: payload.company_details.registration_number || "",
          email: payload.basic_info.email || "",
          phone: payload.company_details.phone || "",
          address: payload.company_details.address || "",
        });
        setBankForm({
          bankName: payload.bank_information.bank_name || "",
          accountHolder: payload.bank_information.account_holder_name || "",
          accountNumber: payload.bank_information.account_number_masked || "",
          routing: payload.bank_information.routing_or_ifsc || "",
        });
      } catch {
        setFetchError("Unable to fetch builder profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const initials = useMemo(() => {
    const company = builderProfile?.company_details.company_name?.trim() || "Builder";
    const parts = company.split(/\s+/).filter(Boolean);
    const chars = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
    return (chars || company.slice(0, 2)).toUpperCase();
  }, [builderProfile?.company_details.company_name]);

  if (loading) {
    return (
      <BuilderLayout>
        <div className="min-w-0 max-w-full overflow-x-hidden space-y-6 sm:space-y-8">
          <Card className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6 text-[#6B7280]">Loading builder profile...</CardContent>
          </Card>
        </div>
      </BuilderLayout>
    );
  }

  return (
    <BuilderLayout>
      <div className="min-w-0 max-w-full overflow-x-hidden space-y-6 sm:space-y-8">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">Company Profile</h1>
          <p className="mt-1 text-[#6B7280]">Manage your company information and settings</p>
          {fetchError && <p className="mt-2 text-sm text-red-600">{fetchError}</p>}
        </div>

        {/* Profile Header */}
        <Card className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
          <CardContent className="min-w-0 p-6 md:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white text-3xl font-semibold">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="min-w-0 break-words text-2xl font-semibold text-[#111827]">
                    {builderProfile?.company_details.company_name || "N/A"}
                  </h2>
                  {builderProfile?.profile_info.verified ? (
                    <Badge className="bg-green-50 text-green-700 border-0 font-medium">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verified Builder
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-50 text-amber-700 border-0 font-medium">Verification Pending</Badge>
                  )}
                </div>
                <p className="mt-1 text-[#6B7280]">{builderProfile?.basic_info.email || "N/A"}</p>
                <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-[#6B7280]">Member Since</p>
                    <p className="font-medium text-[#111827]">{formatMonthYear(builderProfile?.profile_info.member_since)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Total Projects</p>
                    <p className="font-medium text-[#111827]">{builderProfile?.stats.total_projects ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Funds Raised</p>
                    <p className="font-medium text-[#111827]">{formatCurrency(builderProfile?.stats.funds_raised)}</p>
                  </div>
                </div>
              </div>
              <Button className="w-full shrink-0 rounded-xl bg-[#2563EB] font-semibold shadow-sm hover:bg-[#1E40AF] sm:w-auto">Edit Logo</Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="company" className="min-w-0 w-full max-w-full space-y-6">
          <div className="min-w-0 w-full overflow-x-auto overflow-y-hidden">
            <TabsList className="inline-flex w-fit min-w-0 shrink-0 flex-nowrap rounded-xl bg-slate-100 p-1 border border-[#E5E7EB]">
              <TabsTrigger value="company" className="rounded-lg shrink-0 data-[state=active]:bg-white data-[state=active]:text-[#2563EB] data-[state=active]:shadow-sm">Company Details</TabsTrigger>
              <TabsTrigger value="bank" className="rounded-lg shrink-0 data-[state=active]:bg-white data-[state=active]:text-[#2563EB] data-[state=active]:shadow-sm">Bank Information</TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg shrink-0 data-[state=active]:bg-white data-[state=active]:text-[#2563EB] data-[state=active]:shadow-sm">Security</TabsTrigger>
            </TabsList>
          </div>

          {/* Company Details Tab */}
          <TabsContent value="company" className="min-w-0 outline-none">
            <Card className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
              <CardHeader className="border-b border-[#E5E7EB]">
                <CardTitle className="text-[#111827]">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0 p-6">
                <form className="min-w-0 space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="companyName" className="text-[#374151] font-medium">Company Name</Label>
                      <div className="relative min-w-0">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-[#6B7280]" />
                        <Input
                          id="companyName"
                          value={companyForm.companyName}
                          onChange={(e) => setCompanyForm((p) => ({ ...p, companyName: e.target.value }))}
                          className="min-w-0 w-full max-w-full pl-10 rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="registrationNumber" className="text-[#374151] font-medium">Registration Number</Label>
                      <Input
                        id="registrationNumber"
                        value={companyForm.registrationNumber}
                        onChange={(e) => setCompanyForm((p) => ({ ...p, registrationNumber: e.target.value }))}
                        className="min-w-0 w-full max-w-full rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="email" className="text-[#374151] font-medium">Email Address</Label>
                      <div className="relative min-w-0">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-[#6B7280]" />
                        <Input
                          id="email"
                          type="email"
                          value={companyForm.email}
                          onChange={(e) => setCompanyForm((p) => ({ ...p, email: e.target.value }))}
                          className="min-w-0 w-full max-w-full pl-10 rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="phone" className="text-[#374151] font-medium">Phone Number</Label>
                      <div className="relative min-w-0">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-[#6B7280]" />
                        <Input
                          id="phone"
                          value={companyForm.phone}
                          onChange={(e) => setCompanyForm((p) => ({ ...p, phone: e.target.value }))}
                          className="min-w-0 w-full max-w-full pl-10 rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="address" className="text-[#374151] font-medium">Office Address</Label>
                    <div className="relative min-w-0">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-[#6B7280]" />
                      <Input
                        id="address"
                        value={companyForm.address}
                        onChange={(e) => setCompanyForm((p) => ({ ...p, address: e.target.value }))}
                        className="min-w-0 w-full max-w-full pl-10 rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-wrap justify-end gap-3">
                    <Button type="button" variant="outline" className="rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-slate-50">Cancel</Button>
                    <Button type="submit" className="rounded-xl bg-[#2563EB] font-semibold shadow-sm hover:bg-[#1E40AF]">Save Changes</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Information Tab */}
          <TabsContent value="bank" className="min-w-0 outline-none">
            <Card className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
              <CardHeader className="border-b border-[#E5E7EB]">
                <CardTitle className="text-[#111827]">Bank Account Details</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0 p-6">
                <form className="min-w-0 space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="bankName" className="text-[#374151] font-medium">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm((p) => ({ ...p, bankName: e.target.value }))}
                        className="min-w-0 w-full max-w-full rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]"
                      />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="accountHolder" className="text-[#374151] font-medium">Account Holder Name</Label>
                      <Input
                        id="accountHolder"
                        value={bankForm.accountHolder}
                        onChange={(e) => setBankForm((p) => ({ ...p, accountHolder: e.target.value }))}
                        className="min-w-0 w-full max-w-full rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="accountNumber" className="text-[#374151] font-medium">Account Number</Label>
                      <div className="relative min-w-0">
                        <CreditCard className="absolute left-3 top-3 h-4 w-4 text-[#6B7280]" />
                        <Input
                          id="accountNumber"
                          value={bankForm.accountNumber}
                          onChange={(e) => setBankForm((p) => ({ ...p, accountNumber: e.target.value }))}
                          className="min-w-0 w-full max-w-full pl-10 rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="routing" className="text-[#374151] font-medium">Routing Number</Label>
                      <Input
                        id="routing"
                        value={bankForm.routing}
                        onChange={(e) => setBankForm((p) => ({ ...p, routing: e.target.value }))}
                        className="min-w-0 w-full max-w-full rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-wrap justify-end gap-3">
                    <Button type="button" variant="outline" className="rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-slate-50">Cancel</Button>
                    <Button type="submit" className="rounded-xl bg-[#2563EB] font-semibold shadow-sm hover:bg-[#1E40AF]">Update Bank Details</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="min-w-0 outline-none">
            <Card className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
              <CardHeader className="border-b border-[#E5E7EB]">
                <CardTitle className="text-[#111827]">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0 p-6">
                <form className="min-w-0 space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="currentPassword" className="text-[#374151] font-medium">Current Password</Label>
                    <Input id="currentPassword" type="password" className="min-w-0 w-full max-w-full rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]" />
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="newPassword" className="text-[#374151] font-medium">New Password</Label>
                      <Input id="newPassword" type="password" className="min-w-0 w-full max-w-full rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]" />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="confirmPassword" className="text-[#374151] font-medium">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" className="min-w-0 w-full max-w-full rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]" />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-wrap justify-end gap-3">
                    <Button type="button" variant="outline" className="rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-slate-50">Cancel</Button>
                    <Button type="submit" className="rounded-xl bg-[#2563EB] font-semibold shadow-sm hover:bg-[#1E40AF]">Update Password</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BuilderLayout>
  );
}
