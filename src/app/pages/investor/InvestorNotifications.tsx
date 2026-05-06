import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { investorMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  ArrowDownToLine,
  ArrowUpRight,
  CheckCircle,
  CreditCard,
  Landmark,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import { formatINR } from "../../utils/currency";

type NotificationType = "success" | "warning" | "info" | string;
type FilterKey = "all" | "payment" | "wallet" | "withdrawal" | "returns";

type InvestorNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  status?: string;
  amount?: number;
  channel?: string;
};

function getNotificationIcon(notification: InvestorNotification) {
  const text = `${notification.title} ${notification.channel}`.toLowerCase();
  if (text.includes("withdraw")) return Landmark;
  if (text.includes("razorpay") || text.includes("payment")) return CreditCard;
  if (text.includes("wallet")) return WalletCards;
  if (text.includes("payout") || text.includes("return")) return ArrowDownToLine;
  if (notification.type === "warning") return TriangleAlert;
  return CheckCircle;
}

function getFilterKey(notification: InvestorNotification): Exclude<FilterKey, "all"> {
  const text = `${notification.title} ${notification.message} ${notification.channel}`.toLowerCase();
  if (text.includes("withdraw")) return "withdrawal";
  if (text.includes("razorpay") || text.includes("payment")) return "payment";
  if (text.includes("payout") || text.includes("return")) return "returns";
  return "wallet";
}

function getAccentClasses(type: NotificationType) {
  if (type === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (type === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function normalizeAmount(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export default function InvestorNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<InvestorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/investor/login", { replace: true });
      return;
    }

    const fetchNotifications = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/investor/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));

        if (res.status === 401) {
          navigate("/investor/login", { replace: true });
          return;
        }
        if (!res.ok || !data?.success) {
          setError(data?.message || "Failed to load notifications.");
          setNotifications([]);
          return;
        }

        setNotifications(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setError("Network error while loading notifications.");
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [navigate]);

  const counts = useMemo(() => {
    const payment = notifications.filter((n) => getFilterKey(n) === "payment").length;
    const withdrawal = notifications.filter((n) => getFilterKey(n) === "withdrawal").length;
    const wallet = notifications.filter((n) => getFilterKey(n) === "wallet").length;
    return { payment, withdrawal, wallet, total: notifications.length };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    return notifications.filter((notification) => getFilterKey(notification) === activeFilter);
  }, [activeFilter, notifications]);

  const filters: Array<{ key: FilterKey; label: string; count: number }> = [
    { key: "all", label: "All", count: counts.total },
    { key: "payment", label: "Razorpay", count: counts.payment },
    { key: "wallet", label: "Wallet", count: counts.wallet },
    { key: "withdrawal", label: "Withdrawals", count: counts.withdrawal },
    { key: "returns", label: "Returns", count: notifications.filter((n) => getFilterKey(n) === "returns").length },
  ];

  return (
    <DashboardLayout
      sidebarItems={investorMenuItems}
      userName="John Investor"
      userRole="Investor"
      logoText="RealEstate"
    >
      <div className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.08em] text-blue-600">Transaction alerts</p>
            <h1 className="mt-1 text-3xl font-semibold text-gray-950">Notifications</h1>
            <p className="mt-1 text-gray-500">
              Razorpay payments, wallet activity, payouts, and bank withdrawal updates in one place.
            </p>
            {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
          </div>
          <Button
            variant="outline"
            className="w-full border-gray-200 bg-white text-gray-700 hover:bg-slate-50 sm:w-auto"
            onClick={() => setNotifications((items) => items.map((item) => ({ ...item, read: true })))}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>

        <Card className="rounded-xl border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-4 pb-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-gray-950">All Notifications</CardTitle>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <Button
                    key={filter.key}
                    type="button"
                    variant={activeFilter === filter.key ? "default" : "outline"}
                    size="sm"
                    className={activeFilter === filter.key ? "bg-blue-600 text-white hover:bg-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-slate-50"}
                    onClick={() => setActiveFilter(filter.key)}
                  >
                    {filter.label}
                    <span className="ml-2 rounded-full bg-white/20 px-2 text-xs">{filter.count}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                Loading notifications...
              </div>
            )}

            {!loading && filteredNotifications.length === 0 && (
              <div className="rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                No notifications found.
              </div>
            )}

            {!loading && filteredNotifications.length > 0 && (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification);
                  const amount = normalizeAmount(notification.amount);
                  return (
                    <div
                      key={notification.id}
                      className={`grid gap-4 rounded-lg border p-4 transition-colors hover:bg-slate-50 sm:grid-cols-[auto_1fr_auto] ${
                        notification.read ? "border-gray-200 bg-white" : "border-blue-200 bg-blue-50/40"
                      }`}
                    >
                      <div className={`flex h-11 w-11 items-center justify-center rounded-lg border ${getAccentClasses(notification.type)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-950">{notification.title}</p>
                          {!notification.read && <Badge className="border-0 bg-blue-100 text-blue-700">New</Badge>}
                          {notification.channel && <Badge variant="outline" className="border-gray-200 text-gray-600">{notification.channel}</Badge>}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-gray-600">{notification.message}</p>
                        <p className="mt-2 text-xs font-medium text-gray-400">{notification.time}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                        {amount ? <p className="font-semibold text-gray-950">{formatINR(amount)}</p> : <ArrowUpRight className="h-4 w-4 text-gray-400" />}
                        {notification.status && (
                          <Badge className={`mt-0 border-0 sm:mt-2 ${notification.type === "warning" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {notification.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
