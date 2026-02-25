import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { investorMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { User, Mail, Phone, MapPin, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function InvestorProfile() {
  return (
    <DashboardLayout
      sidebarItems={investorMenuItems}
      userName="John Investor"
      userRole="Investor"
      logoText="RealEstate"
    >
      <div className="min-w-0 space-y-5 sm:space-y-6">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-gray-900 sm:text-3xl">My Profile</h1>
          <p className="text-gray-500">Manage your personal information and settings</p>
        </div>

        {/* Profile Header */}
        <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-gray-200 bg-blue-600 text-white text-3xl font-semibold">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h2 className="break-words text-xl font-semibold text-gray-900 sm:text-2xl">John Investor</h2>
                  <Badge className="bg-emerald-50 text-green-600 border-0">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                </div>
                <p className="mt-1 text-gray-500">investor@example.com</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium text-gray-900">January 2025</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Investments</p>
                    <p className="font-medium text-gray-900">₹45,000</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Projects</p>
                    <p className="font-medium text-gray-900">8 Projects</p>
                  </div>
                </div>
              </div>
              <Button className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">Edit Profile Photo</Button>
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
                          defaultValue="John"
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
                          defaultValue="Investor"
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
                          defaultValue="investor@example.com"
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
                          defaultValue="+1 (555) 123-4567"
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
                        defaultValue="123 Main Street, New York, NY 10001"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" defaultValue="New York" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" defaultValue="NY" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input id="zip" defaultValue="10001" />
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
                      <Input id="bankName" defaultValue="Chase Bank" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountHolder">Account Holder Name</Label>
                      <Input id="accountHolder" defaultValue="John Investor" />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="accountNumber"
                          defaultValue="****  ****  ****  5678"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="routing">Routing Number</Label>
                      <Input id="routing" defaultValue="****5678" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="swift">SWIFT/BIC Code</Label>
                    <Input id="swift" defaultValue="CHASUS33" />
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
                    <p className="font-medium text-green-900">KYC Verified</p>
                    <p className="text-sm text-green-700">Your account is fully verified</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Verification Documents</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Identity Proof (Passport)", status: "Verified", date: "Jan 5, 2026" },
                      { name: "Address Proof (Utility Bill)", status: "Verified", date: "Jan 5, 2026" },
                      { name: "PAN Card", status: "Verified", date: "Jan 5, 2026" },
                    ].map((doc, index) => (
                      <div key={index} className="flex flex-col items-start justify-between gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center">
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-600">Uploaded on {doc.date}</p>
                        </div>
                        <Badge className="bg-emerald-50 text-green-600 border-0">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Verification Expiry</p>
                      <p className="mt-1">
                        Your KYC verification will expire on Jan 5, 2027. You'll need to renew
                        your documents before this date.
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
