import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
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

type AdminProjectDetails = AdminProjectRow & {
  description?: string | null;
  location?: string | null;
  totalShares?: number;
  pricePerShare?: string | number;
  minInvestment?: string | number;
  expectedROI?: string | number;
  projectDurationMonths?: number | null;
  keyFeatures?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  builderDetails?: {
    companyName: string;
    email: string;
    mobileNumber: string;
  } | null;
  images?: string[];
  investments?: Array<{
    id: number;
    amount: string | number;
    sharesPurchased: number;
    status: string;
    investor: string;
  }>;
};

export default function AdminProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<AdminProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [projectDetails, setProjectDetails] = useState<AdminProjectDetails | null>(null);
  const [approveTarget, setApproveTarget] = useState<AdminProjectRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminProjectRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

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
    setSuccess("");
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
      setSuccess(data?.message || "Project approved successfully.");
      setApproveTarget(null);
      await fetchProjects();
    } catch {
      setError("Network error while approving project.");
    } finally {
      setBusyId(null);
    }
  };

  const openProjectDetails = async (id: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setDetailsOpen(true);
    setDetailsLoading(true);
    setProjectDetails(null);
    setError("");
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        navigate("/login", { replace: true });
        return;
      }
      if (!res.ok || !data?.success) {
        setError(data?.message || "Failed to load project details.");
        return;
      }
      setProjectDetails(data.data ?? null);
    } catch {
      setError("Network error while loading project details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    const reason = rejectReason.trim();
    if (!reason) {
      setError("Rejection reason is required.");
      return;
    }
    setBusyId(rejectTarget.id);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/projects/${rejectTarget.id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(data?.message || "Failed to reject project.");
        return;
      }
      setSuccess(data?.message || "Project rejected successfully.");
      setRejectTarget(null);
      setRejectReason("");
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
          {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
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
                          <Button variant="ghost" size="sm" onClick={() => openProjectDetails(project.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {project.status === "PENDING_APPROVAL" && (
                            <>
                              <Button
                                size="sm"
                                disabled={busyId === project.id}
                                onClick={() => setApproveTarget(project)}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={busyId === project.id}
                                onClick={() => {
                                  setRejectReason("");
                                  setRejectTarget(project);
                                }}
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
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto bg-white sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{projectDetails?.projectName || "Project Details"}</DialogTitle>
              <DialogDescription>
                Review project information, builder details, funding and uploaded images.
              </DialogDescription>
            </DialogHeader>
            {detailsLoading && <p className="text-sm text-gray-500">Loading project details...</p>}
            {!detailsLoading && projectDetails && (
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-gray-500">Builder</p>
                    <p className="font-medium">{projectDetails.builderDetails?.companyName || projectDetails.builder}</p>
                    <p className="mt-2 text-xs text-gray-500">Email</p>
                    <p className="font-medium">{projectDetails.builderDetails?.email || "-"}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-gray-500">Required</p>
                    <p className="font-medium">{toMoney(projectDetails.required)}</p>
                    <p className="mt-2 text-xs text-gray-500">Raised</p>
                    <p className="font-medium text-green-600">{toMoney(projectDetails.raised)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-medium">{projectDetails.status}</p>
                    <p className="mt-2 text-xs text-gray-500">Progress</p>
                    <p className="font-medium">{projectDetails.progress.toFixed(0)}%</p>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-sm font-semibold">Project Information</p>
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <p>Location: {projectDetails.location || "-"}</p>
                    <p>Expected ROI: {projectDetails.expectedROI ?? "-"}%</p>
                    <p>Duration: {projectDetails.projectDurationMonths ? `${projectDetails.projectDurationMonths} months` : "-"}</p>
                    <p>Minimum Investment: {formatINR(projectDetails.minInvestment ?? 0)}</p>
                    <p>Total Shares: {projectDetails.totalShares ?? "-"}</p>
                    <p>Price Per Share: {formatINR(projectDetails.pricePerShare ?? 0)}</p>
                    <p className="md:col-span-2">Key Features: {projectDetails.keyFeatures || "-"}</p>
                    <p className="md:col-span-2">Description: {projectDetails.description || "-"}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-sm font-semibold">Project Images</p>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {(projectDetails.images || []).map((img) => (
                      <a key={img} href={`/api/uploads/${img}`} target="_blank" rel="noreferrer">
                        <img src={`/api/uploads/${img}`} alt="Project" className="h-36 w-full rounded-lg object-cover" />
                      </a>
                    ))}
                    {(projectDetails.images || []).length === 0 && (
                      <p className="text-sm text-gray-500">No images uploaded.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Approve Project?</DialogTitle>
              <DialogDescription>
                {approveTarget?.projectName ? `${approveTarget.projectName} project ne approve karvo chhe?` : "Project ne approve karvo chhe?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveTarget(null)}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 text-white hover:bg-green-700"
                disabled={!!approveTarget && busyId === approveTarget.id}
                onClick={() => approveTarget && handleApprove(approveTarget.id)}
              >
                Approve Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog
          open={!!rejectTarget}
          onOpenChange={(open) => {
            if (!open) {
              setRejectTarget(null);
              setRejectReason("");
            }
          }}
        >
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Project?</DialogTitle>
              <DialogDescription>
                {rejectTarget?.projectName ? `${rejectTarget.projectName} project ne reject karvo chhe?` : "Project ne reject karvo chhe?"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label htmlFor="rejectReason" className="text-sm font-medium text-gray-700">
                Rejection Reason
              </label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="min-h-28 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!rejectReason.trim() || (!!rejectTarget && busyId === rejectTarget.id)}
                onClick={handleReject}
              >
                Reject Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
