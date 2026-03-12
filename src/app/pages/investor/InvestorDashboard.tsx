import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { investorMenuItems } from "../../config/menuItems";
import { StatCard } from "../../components/shared/StatCard";
import { Wallet, FolderKanban, TrendingUp, Clock, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { getKycStatus, syncInvestorUserKycStatus, type KycStatus } from "../../config/kyc";
import { formatINR } from "../../utils/currency";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function getLoggedInInvestorName(): string {
  if (typeof window === "undefined") return "Investor";
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "Investor";
    const parsed = JSON.parse(raw) as { fullName?: string; role?: string };
    if (parsed?.role !== "INVESTOR" || !parsed.fullName?.trim()) return "Investor";
    const [firstName] = parsed.fullName.trim().split(/\s+/);
    return firstName || parsed.fullName.trim() || "Investor";
  } catch {
    return "Investor";
  }
}

type DashboardData = {
  stats: {
    totalInvested: number;
    activeProjects: number;
    totalReturns: number;
    pendingPayouts: number;
  };
  growth: Array<{ month: string; value: number }>;
  activeInvestments: Array<{ id: number; name: string; invested: number; roi: string; status: string }>;
  notifications: Array<{ id: string; title: string; message: string; time: string; type: string }>;
};

const EMPTY_DASHBOARD: DashboardData = {
  stats: { totalInvested: 0, activeProjects: 0, totalReturns: 0, pendingPayouts: 0 },
  growth: [{ month: "No Data", value: 0 }],
  activeInvestments: [],
  notifications: [],
};

export default function InvestorDashboard() {
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState<KycStatus>(() => getKycStatus());
  const [investorName, setInvestorName] = useState<string>(() => getLoggedInInvestorName());
  const [dashboardData, setDashboardData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const syncKycStatus = () => setKycStatus(getKycStatus());
    const syncInvestorName = () => setInvestorName(getLoggedInInvestorName());
    syncKycStatus();
    syncInvestorName();

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      Promise.all([
        fetch("/api/investor/kyc/status", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/investor/dashboard", { headers: { Authorization: `Bearer ${token}` } }),
      ])
        .then(async ([kycRes, dashboardRes]) => {
          const kycData = await kycRes.json().catch(() => ({}));
          if (kycData?.success && kycData.kycStatus) {
            const raw = kycData.kycStatus;
            const mapped: KycStatus =
              raw === "VERIFIED"
                ? "approved"
                : raw === "REJECTED"
                ? "rejected"
                : raw === "PENDING"
                ? "pending"
                : getKycStatus();
            syncInvestorUserKycStatus(mapped);
            setKycStatus(mapped);
            setRejectionReason(mapped === "rejected" ? String(kycData?.rejectionReason || "").trim() : "");
          }

          const d = await dashboardRes.json().catch(() => ({}));
          if (dashboardRes.ok && d?.success && d?.data) {
            const fullName = d.data?.user?.fullName as string | undefined;
            if (fullName?.trim()) {
              const firstName = fullName.trim().split(/\s+/)[0];
              setInvestorName(firstName || fullName.trim());
            }
            setDashboardData({
              stats: {
                totalInvested: Number(d.data?.stats?.totalInvested ?? 0),
                activeProjects: Number(d.data?.stats?.activeProjects ?? 0),
                totalReturns: Number(d.data?.stats?.totalReturns ?? 0),
                pendingPayouts: Number(d.data?.stats?.pendingPayouts ?? 0),
              },
              growth:
                Array.isArray(d.data?.growth) && d.data.growth.length
                  ? d.data.growth
                  : [{ month: "No Data", value: 0 }],
              activeInvestments: Array.isArray(d.data?.activeInvestments) ? d.data.activeInvestments : [],
              notifications: Array.isArray(d.data?.notifications) ? d.data.notifications : [],
            });
          }
        })
        .catch(() => {});
    }

    window.addEventListener("focus", syncKycStatus);
    window.addEventListener("storage", syncKycStatus);
    window.addEventListener("focus", syncInvestorName);
    window.addEventListener("storage", syncInvestorName);

    return () => {
      window.removeEventListener("focus", syncKycStatus);
      window.removeEventListener("storage", syncKycStatus);
      window.removeEventListener("focus", syncInvestorName);
      window.removeEventListener("storage", syncInvestorName);
    };
  }, []);

  const isKycApproved = kycStatus === "approved";
  const isSensitiveLocked = !isKycApproved;

  return (
    <DashboardLayout
      sidebarItems={investorMenuItems}
      userName={investorName}
      userRole="Investor"
      logoText="RealEstate"
    >
      <div className="min-w-0 space-y-5 sm:space-y-8">
        {!isKycApproved && (
          <Alert className={kycStatus === "rejected" ? "border-red-300 bg-red-50 text-red-900" : "border-amber-300 bg-amber-50 text-amber-900"}>
            <TriangleAlert className="h-4 w-4" aria-hidden />
            <AlertTitle>{kycStatus === "rejected" ? "KYC Rejected" : "KYC Required"}</AlertTitle>
            <AlertDescription className={`w-full ${kycStatus === "rejected" ? "text-red-800" : "text-amber-800"}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p>{kycStatus === "rejected" ? "Your KYC was rejected. Please re-submit KYC." : "Complete your KYC to unlock full investment features."}</p>
                  {kycStatus === "rejected" && rejectionReason && (
                    <p className="mt-1 text-sm font-medium">Reason: {rejectionReason}</p>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => navigate("/investor/kyc")}
                  className={`w-full rounded-lg text-white sm:w-auto ${kycStatus === "rejected" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}`}
                >
                  {kycStatus === "rejected" ? "Re-submit KYC" : "Complete KYC"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">Welcome back, {investorName}!</h1>
          <p className="mt-1 text-[#6B7280]">Here's your investment overview</p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Invested"
            value={formatINR(dashboardData.stats.totalInvested)}
            icon={Wallet}
            iconBg="bg-blue-50"
            iconTextColor="text-[#2563EB]"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md"
          />
          <StatCard
            title="Active Projects"
            value={String(dashboardData.stats.activeProjects)}
            icon={FolderKanban}
            iconBg="bg-orange-50"
            iconTextColor="text-orange-600"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md"
          />
          <StatCard
            title="Total Returns"
            value={isSensitiveLocked ? "Locked until KYC approval" : formatINR(dashboardData.stats.totalReturns)}
            icon={TrendingUp}
            iconBg="bg-green-50"
            iconTextColor="text-[#16A34A]"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md"
          />
          <StatCard
            title="Pending Payouts"
            value={isSensitiveLocked ? "Locked until KYC approval" : formatINR(dashboardData.stats.pendingPayouts)}
            icon={Clock}
            iconBg="bg-amber-50"
            iconTextColor="text-amber-600"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md"
          />
        </div>

        <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md min-h-0">
          <CardHeader>
            <CardTitle className="text-[#111827] font-semibold">Investment Growth</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="h-[260px] w-full min-h-[200px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.growth}>
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
                  <Area type="monotone" dataKey="value" stroke="#2563EB" fill="#2563EB" fillOpacity={0.12} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-2">
          <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md min-h-0">
            <CardHeader>
              <CardTitle className="text-[#111827] font-semibold">Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-3 border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words font-medium text-[#111827]">{notification.title}</p>
                        <Badge
                          variant={
                            notification.type === "success"
                              ? "default"
                              : notification.type === "warning"
                              ? "secondary"
                              : "outline"
                          }
                          className={
                            notification.type === "success"
                              ? "bg-green-50 text-green-700 border-0"
                              : notification.type === "warning"
                              ? "bg-yellow-50 text-yellow-700 border-0"
                              : "border-[#E5E7EB]"
                          }
                        >
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#6B7280]">{notification.message}</p>
                      <p className="mt-1 text-xs text-[#6B7280]/80">{notification.time}</p>
                    </div>
                  </div>
                ))}
                {dashboardData.notifications.length === 0 && <p className="text-sm text-[#6B7280]">No recent notifications.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md min-h-0">
            <CardHeader>
              <CardTitle className="text-[#111827] font-semibold">Active Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`space-y-4 ${isSensitiveLocked ? "opacity-50 blur-[1px]" : ""}`}>
                {dashboardData.activeInvestments.map((project) => (
                  <div key={project.id} className="flex flex-col items-start justify-between gap-2 border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-[#111827]">{project.name}</p>
                      <p className="text-sm text-[#6B7280]">Invested: {formatINR(project.invested)}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <Badge className="bg-green-50 text-green-700 border-0">{project.roi} ROI</Badge>
                      <p className="mt-1 text-xs text-[#6B7280]">{project.status}</p>
                    </div>
                  </div>
                ))}
                {dashboardData.activeInvestments.length === 0 && (
                  <p className="text-sm text-[#6B7280]">No active investments found.</p>
                )}
              </div>
              {isSensitiveLocked && (
                <p className="mt-4 text-sm font-medium text-amber-700">
                  Investment and returns actions are locked until KYC is approved.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
