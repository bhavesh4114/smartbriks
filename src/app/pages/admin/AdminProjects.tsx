import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { formatINR } from "../../utils/currency";

type AdminProjectRow = {
  id: number;
  projectName: string;
  builder: string;
  required: number;
  raised: number;
  progress: number;
  status: string;
  rejectionReason?: string | null;
};

export default function AdminProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<AdminProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchProjects = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        navigate("/login", { replace: true });
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(data?.message || "Failed to load projects.");
        return;
      }
      setProjects(Array.isArray(data.data) ? data.data : []);
    } catch {
      setError("Network error while loading projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "APPROVED").length;
    const pending = projects.filter((p) => p.status === "PENDING_APPROVAL").length;
    return { total, active, pending };
  }, [projects]);

  const handleApprove = async (id: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/projects/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(data?.message || "Failed to approve project.");
        return;
      }
      await fetchProjects();
    } catch {
      setError("Network error while approving project.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    const reason = window.prompt("Enter rejection reason:");
    if (!reason?.trim()) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/projects/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(data?.message || "Failed to reject project.");
        return;
      }
      await fetchProjects();
    } catch {
      setError("Network error while rejecting project.");
    } finally {
      setBusyId(null);
    }
  };

  const toMoney = (v: number) => formatINR(v || 0);

  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Project Management</h1>
          <p className="text-gray-600">Approve and manage projects</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="mt-2 text-3xl font-semibold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Active</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.pending}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Builder</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Raised</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loading && projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.projectName}</TableCell>
                      <TableCell>{project.builder}</TableCell>
                      <TableCell>{toMoney(project.required)}</TableCell>
                      <TableCell className="font-semibold text-green-600">{toMoney(project.raised)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full bg-green-500" style={{ width: `${project.progress}%` }} />
                          </div>
                          <span className="text-sm">{project.progress.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            project.status === "APPROVED"
                              ? "bg-green-500"
                              : project.status === "PENDING_APPROVAL"
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }
                        >
                          {project.status === "PENDING_APPROVAL" ? "Pending Approval" : project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {project.status === "PENDING_APPROVAL" && (
                            <>
                              <Button
                                size="sm"
                                disabled={busyId === project.id}
                                onClick={() => handleApprove(project.id)}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={busyId === project.id}
                                onClick={() => handleReject(project.id)}
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
                        Loading projects...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && projects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        No projects found.
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
