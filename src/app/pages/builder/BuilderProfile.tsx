import { BuilderLayout } from "../../components/layout/BuilderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Building2, Mail, Phone, MapPin, CreditCard, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function BuilderProfile() {
  return (
    <BuilderLayout>
      <div className="min-w-0 max-w-full overflow-x-hidden space-y-6 sm:space-y-8">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">Company Profile</h1>
          <p className="mt-1 text-[#6B7280]">Manage your company information and settings</p>
        </div>

        {/* Profile Header */}
        <Card className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
          <CardContent className="min-w-0 p-6 md:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white text-3xl font-semibold">
                EC
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="min-w-0 break-words text-2xl font-semibold text-[#111827]">Elite Constructions</h2>
                  <Badge className="bg-green-50 text-green-700 border-0 font-medium">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified Builder
                  </Badge>
                </div>
                <p className="mt-1 text-[#6B7280]">builder@eliteconstructions.com</p>
                <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-[#6B7280]">Member Since</p>
                    <p className="font-medium text-[#111827]">June 2024</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Total Projects</p>
                    <p className="font-medium text-[#111827]">15</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Funds Raised</p>
                    <p className="font-medium text-[#111827]">$2.4M</p>
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
                <form className="min-w-0 space-y-6">
                  <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="companyName" className="text-[#374151] font-medium">Company Name</Label>
                      <div className="relative min-w-0">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-[#6B7280]" />
                        <Input id="companyName" defaultValue="Elite Constructions" className="min-w-0 w-full max-w-full pl-10 rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]" />
                      </div>
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="registrationNumber" className="text-[#374151] font-medium">Registration Number</Label>
                      <Input id="registrationNumber" defaultValue="REG-12345-2024" className="min-w-0 w-full max-w-full rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]" />
                    </div>
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="email" className="text-[#374151] font-medium">Email Address</Label>
                      <div className="relative min-w-0">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-[#6B7280]" />
                        <Input id="email" type="email" defaultValue="builder@eliteconstructions.com" className="min-w-0 w-full max-w-full pl-10 rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]" />
                      </div>
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="phone" className="text-[#374151] font-medium">Phone Number</Label>
                      <div className="relative min-w-0">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-[#6B7280]" />
                        <Input id="phone" defaultValue="+1 (555) 987-6543" className="min-w-0 w-full max-w-full pl-10 rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="address" className="text-[#374151] font-medium">Office Address</Label>
                    <div className="relative min-w-0">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-[#6B7280]" />
                      <Input id="address" defaultValue="456 Business Ave, New York, NY 10002" className="min-w-0 w-full max-w-full pl-10 rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]" />
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
                <form className="min-w-0 space-y-6">
                  <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="bankName" className="text-[#374151] font-medium">Bank Name</Label>
                      <Input id="bankName" defaultValue="Bank of America" className="min-w-0 w-full max-w-full rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]" />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="accountHolder" className="text-[#374151] font-medium">Account Holder Name</Label>
                      <Input id="accountHolder" defaultValue="Elite Constructions LLC" className="min-w-0 w-full max-w-full rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]" />
                    </div>
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="accountNumber" className="text-[#374151] font-medium">Account Number</Label>
                      <div className="relative min-w-0">
                        <CreditCard className="absolute left-3 top-3 h-4 w-4 text-[#6B7280]" />
                        <Input id="accountNumber" defaultValue="**** **** **** 8765" className="min-w-0 w-full max-w-full pl-10 rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]" />
                      </div>
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="routing" className="text-[#374151] font-medium">Routing Number</Label>
                      <Input id="routing" defaultValue="****8765" className="min-w-0 w-full max-w-full rounded-xl border-[#E5E7EB] focus-visible:ring-[#2563EB]" />
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
                <form className="min-w-0 space-y-6">
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
