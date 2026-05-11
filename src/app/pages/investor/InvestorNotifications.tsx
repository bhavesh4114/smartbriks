import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { investorMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Bell, AlertCircle, CheckCircle, Info, Trash2 } from "lucide-react";

type NotificationRow = {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

const iconFor = (type: string) => (type === "success" ? CheckCircle : type === "warning" ? AlertCircle : Info);
const colorFor = (type: string) =>
  type === "success" ? "text-green-600 bg-emerald-50" : type === "warning" ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50";
const badgeFor = (type: string) =>
  type === "success" ? "bg-emerald-50 text-green-600 border-0" : type === "warning" ? "bg-amber-50 text-amber-600 border-0" : "bg-blue-50 text-blue-600 border-0";

export default function InvestorNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/investor/login", { replace: true });
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/investor/notifications", { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) return navigate("/investor/login", { replace: true });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.message || "Failed to load notifications.");
      setNotifications(Array.isArray(data.data?.notifications) ? data.data.notifications : []);
    } catch (err: any) {
      setError(err?.message || "Network error while loading notifications.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const counts = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    warning: notifications.filter((n) => n.type === "warning").length,
    success: notifications.filter((n) => n.type === "success").length,
  }), [notifications]);

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch("/api/investor/notifications/read", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    await fetchNotifications();
  };

  return (
    <DashboardLayout sidebarItems={investorMenuItems} userName="John Investor" userRole="Investor" logoText="RealEstate">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Notifications</h1>
            <p className="text-gray-500">{loading ? "Loading..." : `${counts.unread} unread notifications`}</p>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-slate-50" onClick={markAllRead}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {[
            ["Total", counts.total, Bell, "text-gray-400"],
            ["Unread", counts.unread, Bell, "text-blue-600"],
            ["Important", counts.warning, AlertCircle, "text-amber-600"],
            ["Updates", counts.success, CheckCircle, "text-green-600"],
          ].map(([label, value, Icon, color]) => (
            <Card key={String(label)} className="bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{label as string}</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{loading ? "--" : String(value)}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-gray-900">All Notifications</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!loading && notifications.length === 0 && <p className="text-sm text-gray-500">No notifications yet.</p>}
              {notifications.map((notification) => {
                const Icon = iconFor(notification.type);
                return (
                  <div key={notification.id} className={`flex items-start gap-4 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-slate-50 ${!notification.read ? "border-l-4 border-l-blue-600 bg-blue-50/50" : ""}`}>
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${colorFor(notification.type)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{notification.title}</p>
                            {!notification.read && <Badge className="bg-blue-50 text-blue-600 text-xs border-0">New</Badge>}
                            <Badge className={badgeFor(notification.type)}>{notification.type}</Badge>
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
      </div>
    </DashboardLayout>
  );
}
