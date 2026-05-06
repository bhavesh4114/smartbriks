import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { investorMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Bell, DollarSign, AlertCircle, CheckCircle, Info, Trash2 } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "success",
    icon: CheckCircle,
    title: "Payout Received",
    message: "₹477 has been credited to your account for January 2026 returns",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    type: "info",
    icon: Info,
    title: "New Project Available",
    message: "Luxury Beachfront Condos in Miami is now open for investment. Expected ROI: 20%",
    time: "5 hours ago",
    read: false,
  },
  {
    id: 3,
    type: "warning",
    icon: AlertCircle,
    title: "Project Update Required",
    message: "Green Valley Villas construction has reached 60% completion. View progress report.",
    time: "1 day ago",
    read: false,
  },
  {
    id: 4,
    type: "success",
    icon: DollarSign,
    title: "Investment Confirmed",
    message: "Your investment of ₹5,000 in Commercial Plaza has been confirmed",
    time: "2 days ago",
    read: true,
  },
  {
    id: 5,
    type: "info",
    icon: Info,
    title: "Document Uploaded",
    message: "Investment agreement for Luxury Apartments is now available for download",
    time: "3 days ago",
    read: true,
  },
  {
    id: 6,
    type: "warning",
    icon: AlertCircle,
    title: "KYC Verification Expiring",
    message: "Your KYC verification will expire in 30 days. Please renew your documents",
    time: "4 days ago",
    read: true,
  },
  {
    id: 7,
    type: "success",
    icon: CheckCircle,
    title: "Monthly Report Generated",
    message: "Your investment summary for January 2026 is ready to download",
    time: "5 days ago",
    read: true,
  },
  {
    id: 8,
    type: "info",
    icon: Info,
    title: "Platform Update",
    message: "New features have been added to the investor dashboard. Check them out!",
    time: "1 week ago",
    read: true,
  },
];

export default function InvestorNotifications() {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600 bg-emerald-50";
      case "warning":
        return "text-amber-600 bg-amber-50";
      case "info":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-emerald-50 text-green-600 border-0";
      case "warning":
        return "bg-amber-50 text-amber-600 border-0";
      case "info":
        return "bg-blue-50 text-blue-600 border-0";
      default:
        return "bg-gray-100 text-gray-600 border-0";
    }
  };

  return (
    <DashboardLayout
      sidebarItems={investorMenuItems}
      userName="John Investor"
      userRole="Investor"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Notifications</h1>
            <p className="text-gray-500">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-slate-50">
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>

        {/* Notification Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{notifications.length}</p>
                </div>
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Unread</p>
                  <p className="mt-2 text-3xl font-semibold text-blue-600">{unreadCount}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Important</p>
                  <p className="mt-2 text-3xl font-semibold text-amber-600">
                    {notifications.filter((n) => n.type === "warning").length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Updates</p>
                  <p className="mt-2 text-3xl font-semibold text-green-600">
                    {notifications.filter((n) => n.type === "success").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">All Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-slate-50 ${
                      !notification.read ? "border-l-4 border-l-blue-600 bg-blue-50/50" : ""
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${getTypeColor(
                        notification.type
                      )}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{notification.title}</p>
                            {!notification.read && (
                              <Badge className="bg-blue-50 text-blue-600 text-xs border-0">New</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                          <p className="mt-2 text-xs text-gray-400">{notification.time}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="flex-shrink-0 text-gray-500 hover:text-gray-900">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Project Updates", description: "Get notified about project progress" },
                { label: "Payment Alerts", description: "Receive alerts for payouts and transactions" },
                { label: "New Opportunities", description: "Be the first to know about new projects" },
                { label: "Account Activity", description: "Security and account-related notifications" },
              ].map((pref, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{pref.label}</p>
                    <p className="text-sm text-gray-500">{pref.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-slate-50">
                      Configure
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
