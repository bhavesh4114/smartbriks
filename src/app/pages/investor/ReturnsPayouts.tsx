import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
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
import { Download, Calendar } from "lucide-react";
import { formatINR } from "../../utils/currency";

type ApiPayout = {
  id?: number | string;
  projectName?: string;
  project?: string;
  project_title?: string;
  amount?: number | string;
  date?: string | Date;
  paidAt?: string | Date;
  dueDate?: string | Date;
  status?: string;
  month?: string;
  period?: string | Date;
  transactionId?: string | null;
  transaction_id?: string | null;
  receiptUrl?: string | null;
  receipt_url?: string | null;
};

type ApiStats = {
  total_paid?: number | string;
  total_pending?: number | string;
  total_returns?: number | string;
  total_payouts?: number | string;
};

type PayoutRow = {
  id: string;
  projectName: string;
  amount: number;
  date: string;
  status: "Paid" | "Pending";
  month: string;
  transactionId: string;
  receiptUrl: string | null;
};

function toNumber(value: string | number | null | undefined): number {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toShortDate(value: string | Date | null | undefined): string {
  if (!value) return "N/A";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return String(value);
  return parsedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function toMonthLabel(value: string | Date | null | undefined): string {
  if (!value) return "N/A";
  if (typeof value === "string" && /\b\d{4}\b/.test(value) && /[A-Za-z]/.test(value) && Number.isNaN(new Date(value).getTime())) {
    return value;
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return String(value);
  return parsedDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function normalizeStatus(status: string | null | undefined): "Paid" | "Pending" {
  return String(status || "").toUpperCase() === "PAID" ? "Paid" : "Pending";
}

function normalizePayout(item: ApiPayout, index: number): PayoutRow {
  return {
    id: String(item.id ?? `${item.transactionId ?? item.transaction_id ?? "payout"}-${index}`),
    projectName: item.projectName || item.project || item.project_title || "Untitled Project",
    amount: toNumber(item.amount),
    date: toShortDate(item.date || item.paidAt || item.dueDate),
    status: normalizeStatus(item.status),
    month: toMonthLabel(item.month || item.period || item.date || item.paidAt || item.dueDate),
    transactionId: item.transactionId || item.transaction_id || "-",
    receiptUrl: item.receiptUrl || item.receipt_url || null,
  };
}

export default function ReturnsPayouts() {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/investor/login", { replace: true });
      return;
    }

    const fetchPayouts = async () => {
      setLoading(true);
      setError("");

      try {
        const endpoints = [
          "/api/investor/returns/payouts",
          "/api/investor/payouts",
          "/api/investor/returns",
        ];
        let data: any = {};
        let success = false;
        let latestMessage = "Failed to load payout history.";
        let onlyUnavailableEndpoints = true;

        for (const endpoint of endpoints) {
          const res = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.status === 401) {
            navigate("/investor/login", { replace: true });
            return;
          }

          data = await res.json().catch(() => ({}));
          if (res.ok && data?.success !== false) {
            success = true;
            break;
          }

          // Avoid surfacing backend permission wording from fallback endpoints on UI.
          if (res.status === 403) {
            onlyUnavailableEndpoints = false;
            latestMessage = "Payout data is not available for this account yet.";
          } else if (res.status === 404 || res.status === 405) {
            latestMessage = "Payout API is not available.";
          } else {
            onlyUnavailableEndpoints = false;
            latestMessage = data?.message || latestMessage;
          }
        }

        if (!success) {
          setError(onlyUnavailableEndpoints ? "" : latestMessage);
          setPayouts([]);
          setStats(null);
          return;
        }

        const rawPayouts = Array.isArray(data?.data?.payouts)
          ? data.data.payouts
          : Array.isArray(data?.data)
            ? data.data
            : [];

        setPayouts(rawPayouts.map((item: ApiPayout, index: number) => normalizePayout(item, index)));
        setStats(data?.data?.stats ?? null);
      } catch {
        setError("Network error while loading payout history.");
        setPayouts([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, [navigate]);

  const computedStats = useMemo(() => {
    const totalPaid = payouts
      .filter((payout) => payout.status === "Paid")
      .reduce((sum, payout) => sum + payout.amount, 0);
    const totalPending = payouts
      .filter((payout) => payout.status === "Pending")
      .reduce((sum, payout) => sum + payout.amount, 0);

    const monthlyMap = new Map<string, { month: string; amount: number; projects: number; status: "Paid" | "Pending" }>();

    payouts.forEach((payout) => {
      const current = monthlyMap.get(payout.month);
      if (current) {
        current.amount += payout.amount;
        current.projects += 1;
        if (payout.status === "Pending") current.status = "Pending";
      } else {
        monthlyMap.set(payout.month, {
          month: payout.month,
          amount: payout.amount,
          projects: 1,
          status: payout.status,
        });
      }
    });

    return {
      totalPaid,
      totalPending,
      totalReturns: totalPaid + totalPending,
      monthlyBreakdown: Array.from(monthlyMap.values()),
    };
  }, [payouts]);

  const summary = {
    totalPaid: toNumber(stats?.total_paid ?? computedStats.totalPaid),
    totalPending: toNumber(stats?.total_pending ?? computedStats.totalPending),
    totalReturns: toNumber(stats?.total_returns ?? stats?.total_payouts ?? computedStats.totalReturns),
  };

  const handleReceiptDownload = (payout: PayoutRow) => {
    if (!payout.receiptUrl) return;
    window.open(payout.receiptUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <DashboardLayout
      sidebarItems={investorMenuItems}
      userName="John Investor"
      userRole="Investor"
      logoText="RealEstate"
    >
      <div className="min-w-0 space-y-5 sm:space-y-6">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-gray-900 sm:text-3xl">Returns & Payouts</h1>
          <p className="text-gray-500">Track your monthly returns and payout history</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="rounded-2xl border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Paid</p>
                  <p className="mt-2 text-3xl font-semibold text-green-600">
                    {loading ? "Loading..." : formatINR(summary.totalPaid)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                  <Download className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Payouts</p>
                  <p className="mt-2 text-3xl font-semibold text-amber-600">
                    {loading ? "Loading..." : formatINR(summary.totalPending)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Returns</p>
                  <p className="mt-2 text-3xl font-semibold text-blue-600">
                    {loading ? "Loading..." : formatINR(summary.totalReturns)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <Download className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="min-w-0 rounded-2xl border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-gray-900">Payout History</CardTitle>
              <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto">
                <Button variant="outline" size="sm" className="w-full border-gray-200 text-gray-700 hover:bg-slate-50 sm:w-auto">
                  <Calendar className="mr-2 h-4 w-4" />
                  Filter by Date
                </Button>
                <Button variant="outline" size="sm" className="w-full border-gray-200 text-gray-700 hover:bg-slate-50 sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="rounded-xl border border-gray-200 p-6 text-center text-gray-500">
                Loading payout history...
              </div>
            )}

            {!loading && payouts.length === 0 && (
              <div className="rounded-xl border border-gray-200 p-6 text-center text-gray-500">
                No payout history found.
              </div>
            )}

            {!loading && payouts.length > 0 && (
              <>
                <div className="space-y-3 md:hidden">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{payout.projectName}</p>
                          <p className="text-sm text-gray-500">{payout.month}</p>
                        </div>
                        <Badge
                          className={
                            payout.status === "Paid"
                              ? "border-0 bg-emerald-50 text-green-600"
                              : "border-0 bg-amber-50 text-amber-600"
                          }
                        >
                          {payout.status}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <p className="text-gray-500">Amount</p>
                        <p className="text-right font-semibold text-gray-900">{formatINR(payout.amount)}</p>
                        <p className="text-gray-500">Date</p>
                        <p className="text-right text-gray-900">{payout.date}</p>
                        <p className="text-gray-500">Txn ID</p>
                        <p className="truncate text-right font-mono text-xs text-gray-500">{payout.transactionId}</p>
                      </div>
                      {payout.status === "Paid" && payout.receiptUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full border-gray-200 text-gray-700 hover:bg-slate-50"
                          onClick={() => handleReceiptDownload(payout)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-500">Project Name</TableHead>
                        <TableHead className="text-gray-500">Period</TableHead>
                        <TableHead className="text-gray-500">Amount</TableHead>
                        <TableHead className="text-gray-500">Date</TableHead>
                        <TableHead className="text-gray-500">Transaction ID</TableHead>
                        <TableHead className="text-gray-500">Status</TableHead>
                        <TableHead className="text-gray-500">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout.id} className="border-gray-200">
                          <TableCell className="font-medium text-gray-900">{payout.projectName}</TableCell>
                          <TableCell className="text-gray-600">{payout.month}</TableCell>
                          <TableCell className="font-semibold text-gray-900">{formatINR(payout.amount)}</TableCell>
                          <TableCell className="text-gray-600">{payout.date}</TableCell>
                          <TableCell className="font-mono text-sm text-gray-500">{payout.transactionId}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                payout.status === "Paid"
                                  ? "border-0 bg-emerald-50 text-green-600"
                                  : "border-0 bg-amber-50 text-amber-600"
                              }
                            >
                              {payout.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payout.status === "Paid" && payout.receiptUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:text-gray-900"
                                onClick={() => handleReceiptDownload(payout)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
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

        <Card className="rounded-2xl border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Monthly Returns Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div className="text-sm text-gray-500">Loading monthly breakdown...</div>}

            {!loading && computedStats.monthlyBreakdown.length === 0 && (
              <div className="text-sm text-gray-500">No monthly payout data available.</div>
            )}

            {!loading && computedStats.monthlyBreakdown.length > 0 && (
              <div className="space-y-4">
                {computedStats.monthlyBreakdown.map((month) => (
                  <div
                    key={month.month}
                    className="flex flex-col items-start justify-between gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{month.month}</p>
                      <p className="text-sm text-gray-500">{month.projects} payouts</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-gray-900">{formatINR(month.amount)}</p>
                      <Badge
                        className={
                          month.status === "Paid"
                            ? "border-0 bg-emerald-50 text-green-600"
                            : "border-0 bg-amber-50 text-amber-600"
                        }
                      >
                        {month.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
