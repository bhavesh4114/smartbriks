import { BuilderLayout } from "../../components/layout/BuilderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Bell, CheckCircle, AlertCircle, Info, DollarSign } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "success",
    icon: CheckCircle,
    title: "New Investment Received",
    message: "John Investor invested ₹12,000 in Luxury Apartments Downtown",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 2,
    type: "info",
    icon: Info,
    title: "Investor Message",
    message: "Sarah Smith has sent you a message about Green Valley Villas",
    time: "3 hours ago",
    read: false,
  },
  {
    id: 3,
    type: "warning",
    icon: AlertCircle,
    title: "Document Pending Approval",
    message: "Building Permit for Green Valley Villas is pending admin approval",
    time: "1 day ago",
    read: false,
  },
  {
    id: 4,
    type: "success",
    icon: DollarSign,
    title: "Funding Goal Reached",
    message: "Green Valley Villas has reached 90% of funding goal",
    time: "2 days ago",
    read: true,
  },
];

export default function BuilderNotifications() {
  return (
    <BuilderLayout>
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">Notifications</h1>
            <p className="mt-1 text-[#6B7280]">{notifications.filter(n => !n.read).length} unread notifications</p>
          </div>
          <Button variant="outline" className="w-full shrink-0 rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-slate-50 sm:w-auto">
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>

        {/* Notification Stats */}
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7280]">Total</p>
                  <p className="mt-2 text-3xl font-semibold text-[#111827]">{notifications.length}</p>
                </div>
                <Bell className="h-8 w-8 text-[#6B7280]" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7280]">Unread</p>
                  <p className="mt-2 text-3xl font-semibold text-[#2563EB]">
                    {notifications.filter(n => !n.read).length}
                  </p>
                </div>
                <Bell className="h-8 w-8 text-[#2563EB]" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7280]">Important</p>
                  <p className="mt-2 text-3xl font-semibold text-[#F59E0B]">
                    {notifications.filter(n => n.type === "warning").length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-[#F59E0B]" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7280]">Updates</p>
                  <p className="mt-2 text-3xl font-semibold text-[#16A34A]">
                    {notifications.filter(n => n.type === "success").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-[#16A34A]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader className="border-b border-[#E5E7EB]">
            <CardTitle className="text-[#111827]">All Notifications</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = notification.icon;
                const getTypeColor = (type: string) => {
                  switch (type) {
                    case "success": return "text-green-700 bg-green-50";
                    case "warning": return "text-yellow-700 bg-yellow-50";
                    case "info": return "text-blue-700 bg-blue-50";
                    default: return "text-[#6B7280] bg-slate-100";
                  }
                };

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 rounded-xl border border-[#E5E7EB] p-4 transition-colors ${!notification.read ? "border-l-4 border-l-[#2563EB] bg-blue-50/30" : "hover:bg-slate-50/50"}`}
                  >
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${getTypeColor(notification.type)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#111827]">{notification.title}</p>
                        {!notification.read && <Badge className="bg-blue-50 text-blue-700 border-0 text-xs font-medium">New</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-[#6B7280]">{notification.message}</p>
                      <p className="mt-2 text-xs text-[#6B7280]">{notification.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </BuilderLayout>
  );
}
