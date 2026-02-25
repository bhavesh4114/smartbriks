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

const investmentData = [
  { month: "Jan", value: 10000 },
  { month: "Feb", value: 15000 },
  { month: "Mar", value: 22000 },
  { month: "Apr", value: 28000 },
  { month: "May", value: 35000 },
  { month: "Jun", value: 45000 },
];

const recentNotifications = [
  { id: 1, title: "Payout Received", message: "₹2,500 credited to your account", time: "2 hours ago", type: "success" },
  { id: 2, title: "New Project Available", message: "Luxury Apartments in Downtown", time: "5 hours ago", type: "info" },
  { id: 3, title: "Project Update", message: "Green Valley Villas - 60% complete", time: "1 day ago", type: "warning" },
];

export default function InvestorDashboard() {
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState<KycStatus>(() => getKycStatus());
  const [investorName, setInvestorName] = useState<string>(() => getLoggedInInvestorName());

  useEffect(() => {
    const syncKycStatus = () => setKycStatus(getKycStatus());
    const syncInvestorName = () => setInvestorName(getLoggedInInvestorName());
    syncKycStatus();
    syncInvestorName();

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      fetch("/api/investor/kyc/status", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data.kycStatus) {
            const raw = data.kycStatus;
            const mapped: KycStatus =
              raw === "VERIFIED" ? "approved" : raw === "REJECTED" ? "rejected" : raw === "PENDING" ? "pending" : getKycStatus();
            syncInvestorUserKycStatus(mapped);
            setKycStatus(mapped);
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
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <TriangleAlert className="h-4 w-4" aria-hidden />
            <AlertTitle>KYC Required</AlertTitle>
            <AlertDescription className="w-full text-amber-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>Complete your KYC to unlock full investment features.</p>
                <Button
                  type="button"
                  onClick={() => navigate("/investor/kyc")}
                  className="w-full rounded-lg bg-amber-600 text-white hover:bg-amber-700 sm:w-auto"
                >
                  Complete KYC
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">Welcome back, {investorName}!</h1>
          <p className="mt-1 text-[#6B7280]">Here's your investment overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Invested"
            value="₹45,000"
            icon={Wallet}
            iconBg="bg-blue-50"
            iconTextColor="text-[#2563EB]"
            trend={{ value: "+12.5%", isPositive: true }}
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md"
          />
          <StatCard
            title="Active Projects"
            value="8"
            icon={FolderKanban}
            iconBg="bg-orange-50"
            iconTextColor="text-orange-600"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md"
          />
          <StatCard
            title="Total Returns"
            value={isSensitiveLocked ? "Locked until KYC approval" : "₹6,750"}
            icon={TrendingUp}
            iconBg="bg-green-50"
            iconTextColor="text-[#16A34A]"
            trend={isSensitiveLocked ? undefined : { value: "+8.2%", isPositive: true }}
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md"
          />
          <StatCard
            title="Pending Payouts"
            value={isSensitiveLocked ? "Locked until KYC approval" : "₹2,500"}
            icon={Clock}
            iconBg="bg-amber-50"
            iconTextColor="text-amber-600"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md"
          />
        </div>

        {/* Investment Growth Chart */}
        <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md min-h-0">
          <CardHeader>
            <CardTitle className="text-[#111827] font-semibold">Investment Growth</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="h-[260px] w-full min-h-[200px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={investmentData}>
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
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563EB"
                  fill="#2563EB"
                  fillOpacity={0.12}
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Recent Notifications */}
          <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md min-h-0">
            <CardHeader>
              <CardTitle className="text-[#111827] font-semibold">Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentNotifications.map((notification) => (
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
              </div>
            </CardContent>
          </Card>

          {/* Active Investments */}
          <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-shadow duration-200 lg:hover:shadow-md min-h-0">
            <CardHeader>
              <CardTitle className="text-[#111827] font-semibold">Active Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`space-y-4 ${isSensitiveLocked ? "opacity-50 blur-[1px]" : ""}`}>
                {[
                  { name: "Luxury Apartments Downtown", invested: "₹12,000", roi: "15%", status: "Active" },
                  { name: "Green Valley Villas", invested: "₹8,500", roi: "12%", status: "Active" },
                  { name: "Commercial Plaza", invested: "₹15,000", roi: "18%", status: "Active" },
                ].map((project, index) => (
                  <div key={index} className="flex flex-col items-start justify-between gap-2 border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-[#111827]">{project.name}</p>
                      <p className="text-sm text-[#6B7280]">Invested: {project.invested}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <Badge className="bg-green-50 text-green-700 border-0">{project.roi} ROI</Badge>
                      <p className="mt-1 text-xs text-[#6B7280]">{project.status}</p>
                    </div>
                  </div>
                ))}
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
