import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { StatCard } from "../../components/shared/StatCard";
import { Users, Building2, FolderKanban, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { formatINR } from "../../utils/currency";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type AdminDashboardData = {
  stats: {
    totalInvestors: number;
    totalBuilders: number;
    totalAdmins: number;
    totalProjects: number;
    walletBalance: number | string;
  };
  monthly: { month: string; investments: number; payouts: number; projects: number }[];
  userDistribution: { name: string; value: number; color: string }[];
  recentInvestments: { investor: string; project: string; amount: number | string; time: string }[];
  pendingApprovals: { type: string; name: string; item: string; time: string }[];
};

const emptyDashboard: AdminDashboardData = {
  stats: {
    totalInvestors: 0,
    totalBuilders: 0,
    totalAdmins: 0,
    totalProjects: 0,
    walletBalance: 0,
  },
  monthly: [],
  userDistribution: [
    { name: "Investors", value: 0, color: "#10b981" },
    { name: "Builders", value: 0, color: "#f59e0b" },
    { name: "Admins", value: 0, color: "#0f3460" },
  ],
  recentInvestments: [],
  pendingApprovals: [],
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AdminDashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setError("");
    fetch("/api/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          navigate("/login", { replace: true });
          return;
        }
        if (!res.ok || !data?.success || !data?.data) {
          setError(data?.message || "Failed to load dashboard data.");
          setDashboard(emptyDashboard);
          return;
        }
        setDashboard(data.data as AdminDashboardData);
      })
      .catch(() => {
        setError("Network error while loading dashboard data.");
        setDashboard(emptyDashboard);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const monthlyData = useMemo(() => dashboard.monthly, [dashboard.monthly]);
  const userDistribution = useMemo(
    () => (dashboard.userDistribution.length ? dashboard.userDistribution : emptyDashboard.userDistribution),
    [dashboard.userDistribution]
  );
  const stats = dashboard.stats;

  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="min-w-0 space-y-6 sm:space-y-8">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Investors"
            value={loading ? "Loading..." : String(stats.totalInvestors)}
            icon={Users}
            iconBg="bg-green-50"
            iconTextColor="text-[#16A34A]"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md"
          />
          <StatCard
            title="Total Builders"
            value={loading ? "Loading..." : String(stats.totalBuilders)}
            icon={Building2}
            iconBg="bg-orange-50"
            iconTextColor="text-orange-600"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md"
          />
          <StatCard
            title="Total Projects"
            value={loading ? "Loading..." : String(stats.totalProjects)}
            icon={FolderKanban}
            iconBg="bg-blue-50"
            iconTextColor="text-[#2563EB]"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md"
          />
          <StatCard
            title="Wallet Balance"
            value={loading ? "Loading..." : formatINR(Number(stats.walletBalance ?? 0))}
            icon={Wallet}
            iconBg="bg-violet-50"
            iconTextColor="text-violet-600"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md"
          />
        </div>

        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-2">
          <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-[#111827] font-semibold">Monthly Investments & Payouts</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="h-[260px] w-full min-h-[200px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: "12px",
                        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="investments" stroke="#10b981" name="Investments" />
                    <Line type="monotone" dataKey="payouts" stroke="#f59e0b" name="Payouts" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md min-h-0">
            <CardHeader>
              <CardTitle className="text-[#111827] font-semibold">User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md min-h-0">
          <CardHeader>
            <CardTitle className="text-[#111827] font-semibold">Monthly Project Creation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="projects" fill="#2563EB" name="New Projects" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-2">
          <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md min-h-0">
            <CardHeader>
              <CardTitle className="text-[#111827] font-semibold">Recent Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.recentInvestments.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-[#111827]">{item.investor}</p>
                      <p className="text-sm text-[#6B7280]">{item.project}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#16A34A]">{formatINR(Number(item.amount ?? 0))}</p>
                      <p className="text-xs text-[#6B7280]">{item.time}</p>
                    </div>
                  </div>
                ))}
                {!loading && dashboard.recentInvestments.length === 0 && (
                  <p className="text-sm text-[#6B7280]">No recent investments found.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md min-h-0">
            <CardHeader>
              <CardTitle className="text-[#111827] font-semibold">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.pendingApprovals.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-[#111827]">{item.name}</p>
                      <p className="text-sm text-[#6B7280]">{item.item}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-600">{item.type}</p>
                      <p className="text-xs text-[#6B7280]">{item.time}</p>
                    </div>
                  </div>
                ))}
                {!loading && dashboard.pendingApprovals.length === 0 && (
                  <p className="text-sm text-[#6B7280]">No pending approvals.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
