import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { BuilderLayout } from "../../components/layout/BuilderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Mail, Phone, Eye, Download } from "lucide-react";
import { formatINR } from "../../utils/currency";

type InvestorRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  totalInvested: number | string;
  projects: number;
  joinDate: string | Date;
  status: string;
};

type InvestorStats = {
  total_investors: number;
  active_investors: number;
  total_invested: number | string;
  avg_investment: number | string;
};

export default function BuilderInvestors() {
  const navigate = useNavigate();
  const [investors, setInvestors] = useState<InvestorRow[]>([]);
  const [stats, setStats] = useState<InvestorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/builder/login", { replace: true });
      return;
    }

    const fetchInvestors = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/builders/investors", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          navigate("/builder/login", { replace: true });
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          setError(data?.message || "Failed to load investors.");
          setInvestors([]);
          setStats(null);
          return;
        }
        setInvestors(Array.isArray(data?.data?.investors) ? data.data.investors : []);
        setStats(data?.data?.stats ?? null);
      } catch {
        setError("Network error while loading investors.");
        setInvestors([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestors();
  }, [navigate]);

  const computedStats = useMemo(() => {
    const totalInvested = investors.reduce((sum, inv) => {
      const amt = Number(inv.totalInvested ?? 0);
      return sum + (Number.isFinite(amt) ? amt : 0);
    }, 0);
    const totalInvestors = investors.length;
    const activeInvestors = investors.filter((inv) => inv.status === "Active").length;
    const avgInvestment = totalInvestors ? totalInvested / totalInvestors : 0;
    return { totalInvested, totalInvestors, activeInvestors, avgInvestment };
  }, [investors]);

  const summary = {
    totalInvestors: stats?.total_investors ?? computedStats.totalInvestors,
    activeInvestors: stats?.active_investors ?? computedStats.activeInvestors,
    totalInvested: Number(stats?.total_invested ?? computedStats.totalInvested),
    avgInvestment: Number(stats?.avg_investment ?? computedStats.avgInvestment),
  };

  const toShortDate = (value: string | Date) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const topInvestors = useMemo(() => {
    return [...investors]
      .sort((a, b) => Number(b.totalInvested ?? 0) - Number(a.totalInvested ?? 0))
      .slice(0, 5);
  }, [investors]);

  return (
    <BuilderLayout>
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">Investor Management</h1>
            <p className="mt-1 text-[#6B7280]">Manage your investors and view their details</p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <Button className="w-full shrink-0 rounded-xl bg-[#2563EB] font-semibold shadow-sm hover:bg-[#1E40AF] sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export List
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-[#6B7280]">Total Investors</p>
              <p className="mt-2 text-3xl font-semibold text-[#111827]">
                {loading ? "Loading..." : summary.totalInvestors}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-[#6B7280]">Total Invested</p>
              <p className="mt-2 text-3xl font-semibold text-[#16A34A]">
                {loading ? "Loading..." : formatINR(summary.totalInvested)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-[#6B7280]">Active Investors</p>
              <p className="mt-2 text-3xl font-semibold text-[#2563EB]">
                {loading ? "Loading..." : summary.activeInvestors}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-[#6B7280]">Avg Investment</p>
              <p className="mt-2 text-3xl font-semibold text-[#111827]">
                {loading ? "Loading..." : formatINR(summary.avgInvestment)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Investors Table */}
        <Card className="min-w-0 rounded-2xl border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-[#E5E7EB]">
            <CardTitle className="text-[#111827]">All Investors</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E5E7EB] hover:bg-transparent">
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Name</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Email</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Phone</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Total Invested</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Projects</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Join Date</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Status</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investors.map((investor) => (
                    <TableRow key={investor.id} className="border-[#E5E7EB] hover:bg-slate-50">
                      <TableCell className="font-medium text-[#111827]">{investor.name}</TableCell>
                      <TableCell className="text-[#6B7280]">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#6B7280]" />
                          {investor.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#6B7280]">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#6B7280]" />
                          {investor.phone}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-[#16A34A]">
                        {formatINR(investor.totalInvested)}
                      </TableCell>
                      <TableCell className="text-[#111827]">{investor.projects}</TableCell>
                      <TableCell className="text-[#6B7280]">{toShortDate(investor.joinDate)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-50 text-green-700 border-0 font-medium">{investor.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-[#2563EB] hover:bg-blue-50 hover:text-[#2563EB]">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && investors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-6 text-center text-[#6B7280]">
                        No investors found yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Top Investors */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader className="border-b border-[#E5E7EB]">
            <CardTitle className="text-[#111827]">Top Investors</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {topInvestors.map((investor, index) => (
                <div
                  key={investor.id}
                  className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB] text-white text-xl font-semibold">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-[#111827]">{investor.name}</p>
                      <p className="text-sm text-[#6B7280]">{investor.projects} Projects</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-[#16A34A]">{formatINR(investor.totalInvested)}</p>
                    <p className="text-sm text-[#6B7280]">Total Invested</p>
                  </div>
                </div>
              ))}
              {!loading && topInvestors.length === 0 && (
                <p className="text-sm text-[#6B7280]">No investors found yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </BuilderLayout>
  );
}
