import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { BuilderLayout } from "../../components/layout/BuilderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Bell, CheckCircle, AlertCircle, Info } from "lucide-react";

type NotificationRow = { id: number; type: string; title: string; message: string; time: string; read: boolean };
const iconFor = (type: string) => (type === "success" ? CheckCircle : type === "warning" ? AlertCircle : Info);
const colorFor = (type: string) =>
  type === "success" ? "text-green-700 bg-green-50" : type === "warning" ? "text-yellow-700 bg-yellow-50" : "text-blue-700 bg-blue-50";

export default function BuilderNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/builder/login", { replace: true });
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/builders/notifications", { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) return navigate("/builder/login", { replace: true });
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

  useEffect(() => { fetchNotifications(); }, []);

  const counts = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    warning: notifications.filter((n) => n.type === "warning").length,
    success: notifications.filter((n) => n.type === "success").length,
  }), [notifications]);

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch("/api/builders/notifications/read", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    await fetchNotifications();
  };

  return (
    <BuilderLayout>
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">Notifications</h1>
            <p className="mt-1 text-[#6B7280]">{loading ? "Loading..." : `${counts.unread} unread notifications`}</p>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          <Button variant="outline" className="w-full shrink-0 rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-slate-50 sm:w-auto" onClick={markAllRead}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total", counts.total, Bell, "text-[#6B7280]"],
            ["Unread", counts.unread, Bell, "text-[#2563EB]"],
            ["Important", counts.warning, AlertCircle, "text-[#F59E0B]"],
            ["Updates", counts.success, CheckCircle, "text-[#16A34A]"],
          ].map(([label, value, Icon, color]) => (
            <Card key={String(label)} className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#6B7280]">{label as string}</p>
                    <p className="mt-2 text-3xl font-semibold text-[#111827]">{loading ? "--" : String(value)}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader className="border-b border-[#E5E7EB]"><CardTitle className="text-[#111827]">All Notifications</CardTitle></CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {!loading && notifications.length === 0 && <p className="text-sm text-[#6B7280]">No notifications yet.</p>}
              {notifications.map((notification) => {
                const Icon = iconFor(notification.type);
                return (
                  <div key={notification.id} className={`flex items-start gap-4 rounded-xl border border-[#E5E7EB] p-4 transition-colors ${!notification.read ? "border-l-4 border-l-[#2563EB] bg-blue-50/30" : "hover:bg-slate-50/50"}`}>
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${colorFor(notification.type)}`}>
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
