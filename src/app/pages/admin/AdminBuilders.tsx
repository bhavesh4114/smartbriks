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

type BuilderRow = {
  id: number;
  company_name: string;
  email: string;
  total_projects: number;
  total_funds_raised: number;
  join_date: string;
  kyc_status: "PENDING" | "VERIFIED" | "REJECTED";
};

type BuilderStats = {
  total_builders: number;
  verified_builders: number;
  pending_builders: number;
};

export default function AdminBuilders() {
  const navigate = useNavigate();
  const [builders, setBuilders] = useState<BuilderRow[]>([]);
  const [stats, setStats] = useState<BuilderStats>({
    total_builders: 0,
    verified_builders: 0,
    pending_builders: 0,
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

      const [buildersRes, statsRes] = await Promise.all([
        fetchFirstOk(["/api/admin/builders", "/api/admin/builder", "/admin/builders", "/admin/builder"]),
        fetchFirstOk([
          "/api/admin/builders/stats",
          "/api/admin/builder/stats",
          "/admin/builders/stats",
          "/admin/builder/stats",
        ]),
      ]);
      if ([buildersRes.status, statsRes.status].some((s) => s === 401 || s === 403)) {
        navigate("/login", { replace: true });
        return;
      }

      const buildersJson = await buildersRes.json().catch(() => ({}));
      const statsJson = await statsRes.json().catch(() => ({}));
      console.log("Builders API response:", buildersJson);
      console.log("Builder stats API response:", statsJson);

      if (!buildersRes.ok || buildersJson?.success === false) {
        setError(buildersJson?.message || `Failed to load builders (HTTP ${buildersRes.status}).`);
        return;
      }
      if (!statsRes.ok || statsJson?.success === false) {
        setError(statsJson?.message || `Failed to load builder stats (HTTP ${statsRes.status}).`);
        return;
      }

      const builderRows = Array.isArray(buildersJson?.builders)
        ? buildersJson.builders
        : Array.isArray(buildersJson?.users)
        ? buildersJson.users
        : Array.isArray(buildersJson?.data)
        ? buildersJson.data
        : [];
      const statsPayload = statsJson?.stats ||
        statsJson?.data ||
        (typeof statsJson?.total_builders === "number"
          ? {
              total_builders: statsJson.total_builders,
              verified_builders: statsJson.verified_builders ?? 0,
              pending_builders: statsJson.pending_builders ?? 0,
            }
          : null);

      setBuilders(builderRows);
      setStats(statsPayload || { total_builders: 0, verified_builders: 0, pending_builders: 0 });
    } catch {
      setError("Network error while loading builders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runAction = async (builderId: number, action: "verify" | "reject", body?: Record<string, unknown>) => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setBusyId(builderId);
    setError("");
    setSuccess("");
    try {
      const endpoints = [
        `/api/admin/builders/${builderId}/${action}`,
        `/api/admin/builder/${builderId}/${action}`,
        `/admin/builders/${builderId}/${action}`,
        `/admin/builder/${builderId}/${action}`,
      ];
      let res: Response | null = null;
      for (const endpoint of endpoints) {
        const candidate = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        if (candidate.status !== 404) {
          res = candidate;
          break;
        }
        res = candidate;
      }
      if (!res) {
        setError("Failed to reach builder action endpoint.");
        return;
      }
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

  const statusClass = (status: BuilderRow["kyc_status"]) =>
    status === "VERIFIED" ? "bg-green-500" : status === "PENDING" ? "bg-amber-500" : "bg-red-500";

  const formatJoinDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Builder Management</h1>
          <p className="text-gray-600">Manage and verify builders</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Total Builders</p>
              <p className="mt-2 text-3xl font-semibold">{stats.total_builders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Verified</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">{stats.verified_builders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.pending_builders}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Builders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Funds Raised</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loading &&
                    builders.map((builder) => (
                      <TableRow key={builder.id}>
                        <TableCell className="font-medium">{builder.company_name}</TableCell>
                        <TableCell>{builder.email}</TableCell>
                        <TableCell>{builder.total_projects}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatINR(builder.total_funds_raised)}
                        </TableCell>
                        <TableCell>{formatJoinDate(builder.join_date)}</TableCell>
                        <TableCell>
                          <Badge className={statusClass(builder.kyc_status)}>{builder.kyc_status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {builder.kyc_status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600"
                                  disabled={busyId === builder.id}
                                  onClick={() => runAction(builder.id, "verify")}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={busyId === builder.id}
                                  onClick={() => handleReject(builder.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        Loading builders...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && builders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        No builders found.
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
