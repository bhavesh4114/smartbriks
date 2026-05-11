import { type FormEvent, useEffect, useMemo, useState } from "react";
import { BuilderLayout } from "../../components/layout/BuilderLayout";
import StatusBadge from "../../components/dashboard/StatusBadge";
import { ArrowLeft, Users, IndianRupee, TrendingUp, ClipboardList, Save } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { formatINR } from "../../utils/currency";

type ProjectTimelineItem = {
  stage: string;
  status: "pending" | "in_progress" | "completed";
  progress: number;
  description: string;
};

type ProjectDetails = {
  id: number;
  title: string;
  description: string;
  location: string;
  projectStatus: string;
  constructionProgress: number;
  timeline: ProjectTimelineItem[];
  currentStage: string | null;
  currentStageStatus: ProjectTimelineItem["status"] | null;
  currentStageDescription: string | null;
  totalValue: number | string;
  totalInvested: number | string;
  investorCount: number;
  progress: number;
};

type InvestmentRow = {
  id: number;
  investedAmount: number | string;
  createdAt: string | Date;
  user?: { fullName?: string } | null;
};

export default function BuilderProjectDetails() {
  const navigate = useNavigate();
  const params = useParams();
  const projectId = params.id || params.projectId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [investments, setInvestments] = useState<InvestmentRow[]>([]);
  const [statusForm, setStatusForm] = useState({
    stage: "Foundation",
    status: "in_progress" as ProjectTimelineItem["status"],
    progress: "0",
    description: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/builder/login", { replace: true });
      return;
    }
    if (!projectId || Number.isNaN(Number(projectId))) {
      setError("Project not found.");
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/builders/projects/${projectId}/investments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          navigate("/builder/login", { replace: true });
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          setError(data?.message || "Failed to load project details.");
          setProject(null);
          setInvestments([]);
          return;
        }
        setProject(data?.data?.project ?? null);
        setInvestments(Array.isArray(data?.data?.investments) ? data.data.investments : []);
      } catch {
        setError("Network error while loading project details.");
        setProject(null);
        setInvestments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [navigate, projectId]);

  useEffect(() => {
    if (!project) return;
    const current =
      project.timeline?.find((item) => item.status === "in_progress") ??
      [...(project.timeline ?? [])].reverse().find((item) => item.status === "completed") ??
      project.timeline?.[0];
    if (!current) return;
    setStatusForm({
      stage: current.stage,
      status: current.status,
      progress: String(current.progress ?? 0),
      description: current.description ?? "",
    });
  }, [project?.id, project?.timeline]);

  const toShortDate = (value: string | Date) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const statusMap = (status: string) => {
    if (["ACTIVE", "APPROVED", "FUNDED"].includes(status)) return "active";
    if (status === "COMPLETED") return "completed";
    if (status === "REJECTED") return "rejected";
    return "pending";
  };

  const timelineStatusLabel = (status?: string | null) => {
    if (status === "completed") return "Completed";
    if (status === "in_progress") return "In Progress";
    return "Pending";
  };

  const timelineStatusClass = (status?: string | null) => {
    if (status === "completed") return "bg-green-50 text-green-700";
    if (status === "in_progress") return "bg-amber-50 text-amber-700";
    return "bg-slate-100 text-slate-600";
  };

  const currentTimeline = useMemo(() => {
    const rows = project?.timeline ?? [];
    return (
      rows.find((item) => item.status === "in_progress") ??
      [...rows].reverse().find((item) => item.status === "completed") ??
      rows[0] ??
      null
    );
  }, [project?.timeline]);

  const handleStatusUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token || !projectId) {
      navigate("/builder/login", { replace: true });
      return;
    }

    const progress = Number(statusForm.progress);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      setStatusError("Progress must be between 0 and 100.");
      setStatusMessage("");
      return;
    }
    if (!statusForm.description.trim()) {
      setStatusError("Update note is required.");
      setStatusMessage("");
      return;
    }

    setSavingStatus(true);
    setStatusError("");
    setStatusMessage("");
    try {
      const res = await fetch(`/api/builders/projects/${projectId}/timeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage: statusForm.stage,
          status: statusForm.status,
          progress,
          description: statusForm.description.trim(),
        }),
      });
      if (res.status === 401 || res.status === 403) {
        navigate("/builder/login", { replace: true });
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setStatusError(data?.message || "Failed to update project status.");
        return;
      }
      const updatedTimeline = Array.isArray(data?.data?.timeline) ? data.data.timeline : project?.timeline ?? [];
      setProject((prev) =>
        prev
          ? {
              ...prev,
              projectStatus: data?.data?.projectStatus ?? prev.projectStatus,
              constructionProgress: Number(data?.data?.constructionProgress ?? prev.constructionProgress ?? 0),
              timeline: updatedTimeline,
              currentStage: statusForm.stage,
              currentStageStatus: data?.data?.updated?.status ?? statusForm.status,
              currentStageDescription: data?.data?.updated?.description ?? statusForm.description.trim(),
            }
          : prev
      );
      setStatusMessage("Project status updated.");
    } catch {
      setStatusError("Network error while updating status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const stats = useMemo(() => {
    const totalInvested = Number(project?.totalInvested ?? 0);
    const totalValue = Number(project?.totalValue ?? 0);
    const progress = Number(project?.progress ?? 0);
    const constructionProgress = Number(project?.constructionProgress ?? 0);
    return {
      totalInvested: Number.isFinite(totalInvested) ? totalInvested : 0,
      totalValue: Number.isFinite(totalValue) ? totalValue : 0,
      progress: Number.isFinite(progress) ? progress : 0,
      constructionProgress: Number.isFinite(constructionProgress) ? constructionProgress : 0,
    };
  }, [project?.constructionProgress, project?.progress, project?.totalInvested, project?.totalValue]);

  return (
    <BuilderLayout>
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <Link
          to="/builder/projects"
          className="inline-flex items-center gap-2 text-[#2563EB] hover:text-[#1E40AF] font-medium"
        >
          <ArrowLeft size={20} />
          Back to Projects
        </Link>

        {loading && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center text-[#6B7280]">
            Loading project details...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-[#FCA5A5] bg-red-50 p-6 text-center text-red-700">
            {error}
          </div>
        )}

        {!loading && project && (
          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="min-w-0 bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 md:p-8">
                <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h1 className="break-words text-xl font-semibold text-[#111827] mb-2 sm:text-2xl">
                      {project.title}
                    </h1>
                    <p className="text-[#6B7280]">{project.location}</p>
                  </div>
                  <StatusBadge status={statusMap(project.projectStatus) as any} />
                </div>
                <p className="text-[#6B7280] leading-relaxed">{project.description}</p>
              </div>

              {/* Investors List */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                <div className="p-6 border-b border-[#E5E7EB]">
                  <h3 className="text-lg font-semibold text-[#111827]">Recent Investors</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50/50 border-b border-[#E5E7EB]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                          Investor
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {investments.map((investor, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-[#111827]">
                            {investor.user?.fullName || "Investor"}
                          </td>
                          <td className="px-6 py-4 font-semibold text-[#111827]">
                            {formatINR(Number(investor.investedAmount ?? 0))}
                          </td>
                          <td className="px-6 py-4 text-[#6B7280]">{toShortDate(investor.createdAt)}</td>
                        </tr>
                      ))}
                      {investments.length === 0 && (
                        <tr>
                          <td className="px-6 py-6 text-center text-[#6B7280]" colSpan={3}>
                            No investments yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <IndianRupee className="text-[#16A34A]" size={24} />
                  <div>
                    <p className="text-sm text-[#6B7280]">Funds Raised</p>
                    <p className="text-2xl font-semibold text-[#111827]">{formatINR(stats.totalInvested)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <Users className="text-[#2563EB]" size={24} />
                  <div>
                    <p className="text-sm text-[#6B7280]">Total Investors</p>
                    <p className="text-2xl font-semibold text-[#111827]">{project.investorCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-[#2563EB]" size={24} />
                  <div>
                    <p className="text-sm text-[#6B7280]">Progress</p>
                    <p className="text-2xl font-semibold text-[#111827]">{stats.progress.toFixed(0)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                <div className="mb-5 flex items-start gap-3">
                  <ClipboardList className="mt-1 shrink-0 text-[#2563EB]" size={24} />
                  <div className="min-w-0">
                    <p className="text-sm text-[#6B7280]">Project Status Update</p>
                    <p className="mt-1 break-words text-xl font-semibold text-[#111827]">
                      {currentTimeline?.stage ?? project.currentStage ?? "Foundation"}
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${timelineStatusClass(
                        currentTimeline?.status ?? project.currentStageStatus
                      )}`}
                    >
                      {timelineStatusLabel(currentTimeline?.status ?? project.currentStageStatus)}
                    </span>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Construction Progress</span>
                    <span className="font-semibold text-[#111827]">{stats.constructionProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#2563EB]"
                      style={{ width: `${Math.max(0, Math.min(100, stats.constructionProgress))}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
                    {currentTimeline?.description || project.currentStageDescription || "No work update added yet."}
                  </p>
                </div>

                <form className="space-y-4 border-t border-[#E5E7EB] pt-5" onSubmit={handleStatusUpdate}>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#374151]" htmlFor="project-stage">
                      Stage
                    </label>
                    <select
                      id="project-stage"
                      value={statusForm.stage}
                      onChange={(event) => {
                        const selected = project.timeline?.find((item) => item.stage === event.target.value);
                        setStatusForm({
                          stage: event.target.value,
                          status: selected?.status ?? "in_progress",
                          progress: String(selected?.progress ?? 0),
                          description: selected?.description ?? "",
                        });
                        setStatusMessage("");
                        setStatusError("");
                      }}
                      className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] outline-none focus:border-[#2563EB]"
                    >
                      {["Foundation", "Structure", "Interiors", "Handover"].map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#374151]" htmlFor="project-status">
                      Status
                    </label>
                    <select
                      id="project-status"
                      value={statusForm.status}
                      onChange={(event) => {
                        const value = event.target.value as ProjectTimelineItem["status"];
                        setStatusForm((prev) => ({
                          ...prev,
                          status: value,
                          progress: value === "completed" ? "100" : prev.progress,
                        }));
                        setStatusMessage("");
                        setStatusError("");
                      }}
                      className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] outline-none focus:border-[#2563EB]"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#374151]" htmlFor="project-progress">
                      Progress %
                    </label>
                    <input
                      id="project-progress"
                      type="number"
                      min="0"
                      max="100"
                      value={statusForm.progress}
                      onChange={(event) => {
                        setStatusForm((prev) => ({ ...prev, progress: event.target.value }));
                        setStatusMessage("");
                        setStatusError("");
                      }}
                      className="h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#111827] outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#374151]" htmlFor="project-note">
                      Update Note
                    </label>
                    <textarea
                      id="project-note"
                      value={statusForm.description}
                      onChange={(event) => {
                        setStatusForm((prev) => ({ ...prev, description: event.target.value }));
                        setStatusMessage("");
                        setStatusError("");
                      }}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  {statusError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{statusError}</p>}
                  {statusMessage && (
                    <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{statusMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={savingStatus}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:bg-[#93C5FD]"
                  >
                    <Save size={16} />
                    {savingStatus ? "Updating..." : "Update Status"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </BuilderLayout>
  );
}
