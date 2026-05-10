import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { BuilderLayout } from "../../components/layout/BuilderLayout";
import { StatCard } from "../../components/shared/StatCard";
import { FolderKanban, Users, DollarSign, TrendingUp, TriangleAlert, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { formatINR } from "../../utils/currency";
import {
  getBuilderKycStatus,
  getBuilderKycRejectionReason,
  setBuilderKycRejectionReason,
  syncBuilderKycStatus,
  type BuilderKycStatus,
} from "../../config/builderKyc";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type BuilderDashboardData = {
  stats: {
    total_projects: number;
    total_investors: number;
    funds_raised: number | string;
    wallet_balance: number | string;
    active_projects: number;
  };
  project_status: { name: string; value: number }[];
  funding: { month: string; raised: number; target: number }[];
  recent_projects: {
    id: number;
    name: string;
    status: string;
    investors: number;
    totalValue: number | string | null;
    totalInvested: number | string | null;
  }[];
  recent_investors: {
    name: string;
    amount: number | string;
    project: string;
    createdAt: string | Date;
  }[];
};

const statusColors: Record<string, string> = {
  Active: "#16A34A",
  Completed: "#2563EB",
  Pending: "#F59E0B",
};

const statusLabel = (status: string) => {
  if (["ACTIVE", "APPROVED", "FUNDED"].includes(status)) return "Active";
  if (status === "COMPLETED") return "Completed";
  if (["PENDING_APPROVAL", "DRAFT"].includes(status)) return "Pending";
  if (status === "REJECTED") return "Rejected";
  return "Pending";
};

const statusBadgeClass = (status: string) => {
  const label = statusLabel(status);
  if (label === "Active") return "bg-green-50 text-green-700 border-0";
  if (label === "Completed") return "bg-blue-50 text-blue-700 border-0";
  if (label === "Rejected") return "bg-red-50 text-red-700 border-0";
  return "bg-amber-50 text-amber-700 border-0";
};

export default function BuilderDashboard() {
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState<BuilderKycStatus>(() => getBuilderKycStatus());
  const [rejectionReason, setRejectionReason] = useState<string>(() => getBuilderKycRejectionReason());
  const [dashboard, setDashboard] = useState<BuilderDashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    const syncKycStatus = () => setKycStatus(getBuilderKycStatus());
    syncKycStatus();

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      setDashboardLoading(true);
      setDashboardError("");
      fetch("/api/builders/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (res.status === 401) {
            navigate("/builder/login", { replace: true });
            return;
          }
          if (res.status === 403) {
            setDashboard(null);
            navigate("/builder/login", { replace: true });
            return;
          }
          if (!res.ok || !data?.success || !data?.data) {
            setDashboardError(data?.message || "Failed to load dashboard data.");
            setDashboard(null);
            return;
          }
          setDashboard(data.data as BuilderDashboardData);
        })
        .catch(() => {
          setDashboardError("Network error while loading dashboard data.");
          setDashboard(null);
        })
        .finally(() => {
          setDashboardLoading(false);
        });

      fetch("/api/builder/kyc/status", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data.kycStatus) {
            const raw = data.kycStatus as string;
            const mapped: BuilderKycStatus =
              raw === "VERIFIED"
                ? "approved"
                : raw === "REJECTED"
                ? "rejected"
                : raw === "PENDING"
                ? "pending"
                : getBuilderKycStatus();
            syncBuilderKycStatus(mapped);
            const reason = typeof data.rejectionReason === "string" ? data.rejectionReason : "";
            setBuilderKycRejectionReason(reason);
            setRejectionReason(reason);
            setKycStatus(mapped);
          }
        })
        .catch(() => {});
    }

    window.addEventListener("focus", syncKycStatus);
    window.addEventListener("storage", syncKycStatus);

    return () => {
      window.removeEventListener("focus", syncKycStatus);
      window.removeEventListener("storage", syncKycStatus);
    };
  }, []);

  const isKycApproved = kycStatus === "approved";
  const isBuilderRestricted = !isKycApproved;
  const stats = dashboard?.stats;

  const projectStatusData = useMemo(() => {
    const rows = dashboard?.project_status ?? [];
    if (!rows.length) {
      return [
        { name: "Active", value: 0, color: statusColors.Active },
        { name: "Completed", value: 0, color: statusColors.Completed },
        { name: "Pending", value: 0, color: statusColors.Pending },
      ];
    }
    return rows.map((row) => ({
      ...row,
      color: statusColors[row.name] || "#94A3B8",
    }));
  }, [dashboard?.project_status]);

  const fundingData = useMemo(() => {
    return dashboard?.funding ?? [];
  }, [dashboard?.funding]);

  const recentProjects = useMemo(() => {
    return (dashboard?.recent_projects ?? []).map((project) => {
      const totalValue = Number(project.totalValue ?? 0);
      const totalInvested = Number(project.totalInvested ?? 0);
      const progress = totalValue > 0 ? Math.min(100, (totalInvested / totalValue) * 100) : 0;
      return {
        ...project,
        label: statusLabel(project.status),
        progress,
      };
    });
  }, [dashboard?.recent_projects]);

  const recentInvestors = useMemo(() => {
    return (dashboard?.recent_investors ?? []).map((investor) => {
      const date = new Date(investor.createdAt);
      const safeDate = Number.isNaN(date.getTime()) ? null : date;
      return {
        ...investor,
        dateLabel: safeDate
          ? safeDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
          : "N/A",
      };
    });
  }, [dashboard?.recent_investors]);

  return (
    <BuilderLayout>
      <div className="min-w-0 space-y-6 sm:space-y-8">
        {dashboardError && (
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <TriangleAlert className="h-4 w-4" aria-hidden />
            <AlertTitle>Dashboard data not available</AlertTitle>
            <AlertDescription>{dashboardError}</AlertDescription>
          </Alert>
        )}
        {isBuilderRestricted && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <TriangleAlert className="h-4 w-4" aria-hidden />
            <AlertTitle>
              {kycStatus === "pending" ? "KYC under review" : kycStatus === "rejected" ? "KYC rejected" : "KYC Required"}
            </AlertTitle>
            <AlertDescription className="w-full text-amber-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  {kycStatus === "pending"
                    ? "KYC submitted. Awaiting admin approval."
                    : kycStatus === "rejected"
                    ? rejectionReason || "Your KYC was rejected. Please re-submit your KYC."
                    : "Complete your KYC to unlock full builder features."}
                </p>
                <Button
                  type="button"
                  onClick={() => navigate("/builder/kyc")}
                  className="rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                >
                  {kycStatus === "pending"
                    ? "Complete KYC"
                    : kycStatus === "rejected"
                    ? "Re-submit KYC"
                    : "Complete KYC"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">Welcome back, Elite Constructions!</h1>
          <p className="mt-1 text-[#6B7280]">
            {isKycApproved ? "KYC Completed / Approved. Here's your project overview" : "Here's your project overview"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid min-w-0 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Projects"
            value={dashboardLoading ? "Loading..." : stats?.total_projects?.toString() ?? "--"}
            icon={FolderKanban}
            iconBg="bg-blue-50"
            iconTextColor="text-[#2563EB]"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm"
          />
          <StatCard
            title="Total Investors"
            value={
              isBuilderRestricted
                ? "Locked until KYC approval"
                : dashboardLoading
                ? "Loading..."
                : String(stats?.total_investors ?? "--")
            }
            icon={Users}
            iconBg="bg-green-50"
            iconTextColor="text-[#16A34A]"
            trend={isBuilderRestricted ? undefined : { value: "+12", isPositive: true }}
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm"
          />
          <StatCard
            title="Funds Raised"
            value={
              isBuilderRestricted
                ? "Locked until KYC approval"
                : dashboardLoading
                ? "Loading..."
                : formatINR(Number(stats?.wallet_balance ?? 0))
            }
            icon={DollarSign}
            iconBg="bg-orange-50"
            iconTextColor="text-orange-600"
            trend={isBuilderRestricted ? undefined : { value: "+18%", isPositive: true }}
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm"
          />
          <StatCard
            title="Active Projects"
            value={dashboardLoading ? "Loading..." : stats?.active_projects?.toString() ?? "--"}
            icon={TrendingUp}
            iconBg="bg-amber-50"
            iconTextColor="text-amber-600"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm"
          />
          <StatCard
            title="Wallet Balance"
            value={
              isBuilderRestricted
                ? "Locked until KYC approval"
                : dashboardLoading
                ? "Loading..."
                : formatINR(Number(stats?.funds_raised ?? 0))
            }
            icon={Wallet}
            iconBg="bg-slate-100"
            iconTextColor="text-slate-700"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm"
          />
        </div>

        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Project Status Chart */}
          <Card className="min-w-0 overflow-hidden bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#111827] font-semibold">Project Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="h-[260px] w-full min-h-[200px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => (value > 0 ? `${name}: ${value}` : null)}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: "12px",
                        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Funding Progress */}
          <Card className="min-w-0 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#111827] font-semibold">Monthly Funding Progress</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="h-[260px] w-full min-h-[200px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fundingData}>
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
                    <Bar dataKey="raised" fill="#2563EB" name="Raised" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" fill="#E5E7EB" name="Target" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#111827] font-semibold">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-medium text-[#111827]">{project.name}</p>
                      <Badge className={statusBadgeClass(project.status)}>{project.label}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6B7280]">
                      <span>{project.investors} Investors</span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {formatINR(Number(project.totalInvested ?? 0))} / {formatINR(Number(project.totalValue ?? 0))}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-[#2563EB]"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-left sm:ml-4 sm:text-right">
                    <div className="text-2xl font-semibold text-[#111827]">{project.progress.toFixed(0)}%</div>
                    <div className="text-sm text-[#6B7280]">Funded</div>
                  </div>
                </div>
              ))}
              {recentProjects.length === 0 && (
                <p className="text-sm text-[#6B7280]">No recent projects yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Recent Investors */}
        <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#111827] font-semibold">Recent Investors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`space-y-3 ${isBuilderRestricted ? "opacity-50 blur-[1px]" : ""}`}>
              {recentInvestors.map((investor, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#2563EB] text-sm font-semibold text-white">
                      {investor.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[#111827] truncate">{investor.name}</p>
                      <p className="text-sm text-[#6B7280] truncate">{investor.project}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="font-semibold text-[#16A34A]">{formatINR(Number(investor.amount ?? 0))}</p>
                    <p className="text-xs text-[#6B7280]">{investor.dateLabel}</p>
                  </div>
                </div>
              ))}
            </div>
            {!isBuilderRestricted && recentInvestors.length === 0 && (
              <p className="mt-4 text-sm text-[#6B7280]">No recent investors yet.</p>
            )}
            {isBuilderRestricted && (
              <p className="mt-4 text-sm font-medium text-amber-700">
                Investment and payout-sensitive builder insights are locked until KYC is approved.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </BuilderLayout>
  );
}



