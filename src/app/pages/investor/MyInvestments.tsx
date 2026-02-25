import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { investorMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Eye, Download } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { formatINR } from "../../utils/currency";

type PortfolioApiItem = {
  id: number;
  projectId: number;
  investedAmount: string | number;
  investmentStatus: "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  project: {
    id: number;
    title: string;
    expectedROI: string | number;
    projectDurationMonths: number | null;
    totalValue: string | number;
    fundsRaised: number;
  };
};

type InvestmentRow = {
  id: number;
  projectId: number;
  projectName: string;
  investedAmount: number;
  dateText: string;
  roi: number;
  expectedReturns: number;
  status: "Active" | "Completed" | "Cancelled";
  durationText: string;
  progress: number;
};

function toNumber(value: string | number | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function normalizeStatus(status: PortfolioApiItem["investmentStatus"]): InvestmentRow["status"] {
  if (status === "COMPLETED") return "Completed";
  if (status === "CANCELLED") return "Cancelled";
  return "Active";
}

export default function MyInvestments() {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<InvestmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/investor/login", { replace: true });
      return;
    }

    const fetchPortfolio = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/investments/portfolio", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          navigate("/investor/login", { replace: true });
          return;
        }

        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.success === false) {
          setError(json?.message || "Failed to load investments.");
          setInvestments([]);
          return;
        }

        const rows: InvestmentRow[] = (Array.isArray(json?.data) ? json.data : []).map((item: PortfolioApiItem) => {
          const investedAmount = toNumber(item.investedAmount);
          const roi = toNumber(item?.project?.expectedROI);
          const expectedReturns = investedAmount * (roi / 100);
          const totalValue = toNumber(item?.project?.totalValue);
          const fundsRaised = toNumber(item?.project?.fundsRaised);
          const progress = totalValue > 0 ? Math.min(100, (fundsRaised / totalValue) * 100) : 0;

          return {
            id: item.id,
            projectId: item.projectId || item?.project?.id,
            projectName: item?.project?.title || "Untitled Project",
            investedAmount,
            dateText: formatDate(item.createdAt),
            roi,
            expectedReturns,
            status: normalizeStatus(item.investmentStatus),
            durationText: item?.project?.projectDurationMonths
              ? `${item.project.projectDurationMonths} months`
              : "N/A",
            progress,
          };
        });

        setInvestments(rows);
      } catch {
        setError("Network error while loading investments.");
        setInvestments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [navigate]);

  const activeInvestments = useMemo(
    () => investments.filter((inv) => inv.status === "Active"),
    [investments]
  );
  const completedInvestments = useMemo(
    () => investments.filter((inv) => inv.status === "Completed"),
    [investments]
  );
  const totalInvested = useMemo(
    () => investments.reduce((sum, inv) => sum + inv.investedAmount, 0),
    [investments]
  );
  const totalReturns = useMemo(
    () => completedInvestments.reduce((sum, inv) => sum + inv.expectedReturns, 0),
    [completedInvestments]
  );

  return (
    <DashboardLayout
      sidebarItems={investorMenuItems}
      userName="John Investor"
      userRole="Investor"
      logoText="RealEstate"
    >
      <div className="min-w-0 space-y-5 sm:space-y-6">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-gray-900 sm:text-3xl">My Investments</h1>
          <p className="mt-1 text-gray-500">Track and manage your investments</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="grid min-w-0 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Total Invested</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{formatINR(totalInvested)}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Active Investments</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{activeInvestments.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Total Returns (Completed)</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">{formatINR(totalReturns)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="min-w-0 overflow-hidden bg-white border-gray-200 rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-gray-900">All Investments</CardTitle>
              <Button variant="outline" size="sm" className="w-full border-gray-200 text-gray-700 hover:bg-slate-50 sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="rounded-xl border border-gray-200 p-6 text-center text-gray-500">
                Loading investments...
              </div>
            )}

            {!loading && investments.length === 0 && (
              <div className="rounded-xl border border-gray-200 p-6 text-center text-gray-500">
                No investments found.
              </div>
            )}

            {!loading && investments.length > 0 && (
              <>
                <div className="space-y-3 md:hidden">
                  {investments.map((investment) => (
                    <div key={investment.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{investment.projectName}</p>
                          <p className="text-sm text-gray-600">{investment.dateText}</p>
                        </div>
                        <Badge
                          className={
                            investment.status === "Active"
                              ? "bg-blue-50 text-blue-600 border-0"
                              : investment.status === "Completed"
                              ? "bg-emerald-50 text-green-600 border-0"
                              : "bg-red-50 text-red-600 border-0"
                          }
                        >
                          {investment.status}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <p className="text-gray-500">Invested</p>
                        <p className="text-right font-medium text-gray-900">{formatINR(investment.investedAmount)}</p>
                        <p className="text-gray-500">ROI</p>
                        <p className="text-right text-gray-900">{investment.roi}%</p>
                        <p className="text-gray-500">Expected</p>
                        <p className="text-right font-medium text-green-600">{formatINR(investment.expectedReturns)}</p>
                        <p className="text-gray-500">Duration</p>
                        <p className="text-right text-gray-900">{investment.durationText}</p>
                      </div>
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                          <span>Progress</span>
                          <span>{investment.progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full ${investment.status === "Completed" ? "bg-green-600" : "bg-blue-600"}`}
                            style={{ width: `${investment.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link to={`/investor/project/${investment.projectId}`}>
                          <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-slate-50">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-500">Project Name</TableHead>
                        <TableHead className="text-gray-500">Invested Amount</TableHead>
                        <TableHead className="text-gray-500">Date</TableHead>
                        <TableHead className="text-gray-500">ROI</TableHead>
                        <TableHead className="text-gray-500">Expected Returns</TableHead>
                        <TableHead className="text-gray-500">Duration</TableHead>
                        <TableHead className="text-gray-500">Progress</TableHead>
                        <TableHead className="text-gray-500">Status</TableHead>
                        <TableHead className="text-gray-500">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investments.map((investment) => (
                        <TableRow key={investment.id} className="border-gray-200">
                          <TableCell className="font-medium text-gray-900">{investment.projectName}</TableCell>
                          <TableCell className="text-gray-600">{formatINR(investment.investedAmount)}</TableCell>
                          <TableCell className="text-gray-600">{investment.dateText}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-green-200 bg-emerald-50 text-green-600">
                              {investment.roi}%
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatINR(investment.expectedReturns)}
                          </TableCell>
                          <TableCell className="text-gray-600">{investment.durationText}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className={`h-full ${investment.status === "Completed" ? "bg-green-600" : "bg-blue-600"}`}
                                  style={{ width: `${investment.progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-500">{investment.progress.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                investment.status === "Active"
                                  ? "bg-blue-50 text-blue-600 border-0"
                                  : investment.status === "Completed"
                                  ? "bg-emerald-50 text-green-600 border-0"
                                  : "bg-red-50 text-red-600 border-0"
                              }
                            >
                              {investment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link to={`/investor/project/${investment.projectId}`}>
                              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
