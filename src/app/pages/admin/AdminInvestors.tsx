import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { formatINR } from "../../utils/currency";

type InvestorRow = {
  id: number;
  name: string;
  email: string;
  total_invested_amount: number;
  total_projects_invested: number;
  kyc_status: "PENDING" | "VERIFIED" | "REJECTED";
  account_status: "ACTIVE" | "BLOCKED";
  created_at: string;
};

type InvestorStats = {
  total_investors: number;
  active_investors: number;
  pending_kyc: number;
  blocked_investors: number;
};

export default function AdminInvestors() {
  const navigate = useNavigate();
  const [investors, setInvestors] = useState<InvestorRow[]>([]);
  const [stats, setStats] = useState<InvestorStats>({
    total_investors: 0,
    active_investors: 0,
    pending_kyc: 0,
    blocked_investors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const fetchData = async () => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const authHeaders = { Authorization: `Bearer ${token}` };
      const fetchFirstOk = async (urls: string[]) => {
        let lastResponse: Response | null = null;
        for (const url of urls) {
          const res = await fetch(url, { headers: authHeaders });
          if (res.status !== 404) return res;
          lastResponse = res;
        }
        return lastResponse as Response;
      };

      const [investorsRes, statsRes] = await Promise.all([
        fetchFirstOk(["/api/admin/investors", "/api/admin/investor"]),
        fetchFirstOk(["/api/admin/investors/stats", "/api/admin/investor/stats"]),
      ]);
      if ([investorsRes.status, statsRes.status].some((s) => s === 401 || s === 403)) {
        navigate("/login", { replace: true });
        return;
      }

      const investorsJson = await investorsRes.json().catch(() => ({}));
      const statsJson = await statsRes.json().catch(() => ({}));
      console.log("Investor API response", investorsJson);
      console.log("Investor stats API response", statsJson);
      if (!investorsRes.ok || !investorsJson?.success) {
        setError(investorsJson?.message || `Failed to load investors (HTTP ${investorsRes.status}).`);
        return;
      }
      if (!statsRes.ok || !statsJson?.success) {
        setError(statsJson?.message || `Failed to load investor stats (HTTP ${statsRes.status}).`);
        return;
      }
      const investorRows = Array.isArray(investorsJson?.investors)
        ? investorsJson.investors
        : Array.isArray(investorsJson?.data)
        ? investorsJson.data
        : Array.isArray(investorsJson?.users)
        ? investorsJson.users
        : [];
      const statsPayload = statsJson?.stats || statsJson?.data;

      setInvestors(investorRows);
      setStats(statsPayload || {
        total_investors: 0,
        active_investors: 0,
        pending_kyc: 0,
        blocked_investors: 0,
      });
    } catch {
      setError("Network error while loading investors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runAction = async (
    investorId: number,
    action: "verify" | "reject" | "block" | "unblock",
    body?: Record<string, unknown>
  ) => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setBusyId(investorId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/investors/${investorId}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        setError(json?.message || "Action failed.");
        return;
      }
      setSuccess(json?.message || "Action completed.");
      await fetchData();
    } catch {
      setError("Network error while performing action.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt("Enter rejection reason (optional):");
    await runAction(id, "reject", reason?.trim() ? { reason: reason.trim() } : {});
  };

  const kycClass = (status: InvestorRow["kyc_status"]) =>
    status === "VERIFIED" ? "bg-green-500" : status === "PENDING" ? "bg-amber-500" : "bg-red-500";
  const accountClass = (status: InvestorRow["account_status"]) =>
    status === "ACTIVE" ? "bg-green-500" : "bg-red-500";

  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Investor Management</h1>
          <p className="text-gray-600">Manage and verify investors</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Total Investors</p>
              <p className="mt-2 text-3xl font-semibold">{stats.total_investors}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Active</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">{stats.active_investors}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.pending_kyc}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Blocked</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">{stats.blocked_investors}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Investors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Invested</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loading && investors.map((investor) => (
                    <TableRow key={investor.id}>
                      <TableCell className="font-medium">{investor.name}</TableCell>
                      <TableCell>{investor.email}</TableCell>
                      <TableCell className="font-semibold text-green-600">{formatINR(investor.total_invested_amount)}</TableCell>
                      <TableCell>{investor.total_projects_invested}</TableCell>
                      <TableCell>
                        <Badge className={kycClass(investor.kyc_status)}>
                          {investor.kyc_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={accountClass(investor.account_status)}>
                          {investor.account_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {investor.kyc_status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600"
                                disabled={busyId === investor.id}
                                onClick={() => runAction(investor.id, "verify")}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={busyId === investor.id}
                                onClick={() => handleReject(investor.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {investor.account_status === "ACTIVE" ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={busyId === investor.id}
                              onClick={() => runAction(investor.id, "block")}
                            >
                              Block
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={busyId === investor.id}
                              onClick={() => runAction(investor.id, "unblock")}
                            >
                              Unblock
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        Loading investors...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && investors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        No investors found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
