import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { BuilderLayout } from "../../components/layout/BuilderLayout";
import StatusBadge from "../../components/dashboard/StatusBadge";
import { ArrowLeft, Clock3, IndianRupee, TrendingUp, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { formatINR } from "../../utils/currency";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

type ProjectDetails = {
  id: number;
  title: string;
  description: string;
  location: string;
  projectStatus: string;
  totalValue: number | string;
  totalInvested: number | string;
  investorCount: number;
  progress: number;
  constructionProgress?: number;
  timeline?: TimelineStage[];
};

type InvestmentRow = {
  id: number;
  investedAmount: number | string;
  createdAt: string | Date;
  user?: { fullName?: string } | null;
};

type TimelineStatus = "pending" | "in_progress" | "completed";
type TimelineStageName = "Foundation" | "Structure" | "Interiors" | "Handover";

type TimelineStage = {
  stage: TimelineStageName;
  progress: number;
  status: TimelineStatus;
  description: string;
};

type TimelineFormState = {
  stage: TimelineStageName;
  status: TimelineStatus;
  progress: number;
  description: string;
};

const defaultTimelineStages: TimelineStage[] = [
  {
    stage: "Foundation",
    progress: 100,
    status: "completed",
    description: "Site preparation, footing work, and base slab have been completed.",
  },
  {
    stage: "Structure",
    progress: 72,
    status: "in_progress",
    description: "Core structural work is progressing across the main towers.",
  },
  {
    stage: "Interiors",
    progress: 28,
    status: "in_progress",
    description: "Sample units and internal utility routing are underway.",
  },
  {
    stage: "Handover",
    progress: 0,
    status: "pending",
    description: "Final finishing, quality checks, and possession planning are pending.",
  },
];

const timelineStageOptions: TimelineStageName[] = ["Foundation", "Structure", "Interiors", "Handover"];
const timelineStatusOptions: TimelineStatus[] = ["pending", "in_progress", "completed"];

function normalizeProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTimelineBarClass(progress: number) {
  if (progress <= 0) return "bg-slate-300";
  if (progress >= 100) return "bg-emerald-500";
  return "bg-amber-400";
}

function getTimelineStatusLabel(status: TimelineStatus) {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In Progress";
  return "Pending";
}

function getTimelineStatusBadgeClass(status: TimelineStatus) {
  if (status === "completed") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (status === "in_progress") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-slate-100 text-slate-600 border border-slate-200";
}

function TimelineStageCard({ item }: { item: TimelineStage }) {
  const progressBarClass = getTimelineBarClass(item.progress);

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-slate-50/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-[#111827] sm:text-base">{item.stage}</h4>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getTimelineStatusBadgeClass(item.status)}`}>
              {getTimelineStatusLabel(item.status)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">{item.description}</p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="text-xl font-semibold text-[#111827]">{item.progress}%</p>
          <p className="text-xs uppercase tracking-[0.18em] text-[#94A3B8]">Progress</p>
        </div>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all duration-300 ${progressBarClass}`} style={{ width: `${item.progress}%` }} />
      </div>
    </div>
  );
}

export default function BuilderProjectDetails() {
  const navigate = useNavigate();
  const params = useParams();
  const projectId = params.id || params.projectId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [investments, setInvestments] = useState<InvestmentRow[]>([]);
  const [timeline, setTimeline] = useState<TimelineStage[]>(defaultTimelineStages);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [timelineSubmitting, setTimelineSubmitting] = useState(false);
  const [timelineError, setTimelineError] = useState("");
  const [timelineSuccess, setTimelineSuccess] = useState("");
  const [timelineForm, setTimelineForm] = useState<TimelineFormState>({
    stage: "Foundation",
    status: "pending",
    progress: 0,
    description: "",
  });

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
        const projectData = data?.data?.project ?? null;
        setProject(projectData);
        setInvestments(Array.isArray(data?.data?.investments) ? data.data.investments : []);
        setTimeline(Array.isArray(projectData?.timeline) && projectData.timeline.length ? projectData.timeline : defaultTimelineStages);
      } catch {
        setError("Network error while loading project details.");
        setProject(null);
        setInvestments([]);
        setTimeline(defaultTimelineStages);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [navigate, projectId]);

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

  const stats = useMemo(() => {
    const totalInvested = Number(project?.totalInvested ?? 0);
    const totalValue = Number(project?.totalValue ?? 0);
    const progress = Number(project?.progress ?? 0);
    return {
      totalInvested: Number.isFinite(totalInvested) ? totalInvested : 0,
      totalValue: Number.isFinite(totalValue) ? totalValue : 0,
      progress: Number.isFinite(progress) ? progress : 0,
    };
  }, [project?.progress, project?.totalInvested, project?.totalValue]);

  const overallTimelineProgress = useMemo(() => {
    if (!timeline.length) return 0;
    const total = timeline.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(total / timeline.length);
  }, [timeline]);

  const handleTimelineStageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedStage = event.target.value as TimelineStageName;
    const existingStage = timeline.find((item) => item.stage === selectedStage);
    setTimelineForm({
      stage: selectedStage,
      status: existingStage?.status ?? "pending",
      progress: existingStage?.progress ?? 0,
      description: existingStage?.description ?? "",
    });
    setTimelineError("");
    setTimelineSuccess("");
  };

  const handleTimelineFormChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setTimelineForm((current) => ({
      ...current,
      [name]: name === "progress" ? normalizeProgress(Number(value)) : value,
    }));
    setTimelineError("");
    setTimelineSuccess("");
  };

  const handleTimelineSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId) return;

    const payload = {
      projectId: Number(projectId),
      stage: timelineForm.stage,
      status: timelineForm.status,
      progress: normalizeProgress(Number(timelineForm.progress)),
      description: timelineForm.description.trim(),
    };

    if (!payload.description) {
      setTimelineError("Please add a short description for this update.");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/builder/login", { replace: true });
      return;
    }

    setTimelineSubmitting(true);
    setTimelineError("");
    setTimelineSuccess("");

    try {
      const res = await fetch("/api/update-timeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setTimelineError(data?.message || "Failed to update project timeline.");
        return;
      }

      const nextTimeline = Array.isArray(data?.data?.timeline) && data.data.timeline.length
        ? data.data.timeline
        : timeline.map((item) =>
            item.stage === payload.stage
              ? {
                  ...item,
                  status: payload.status,
                  progress: payload.progress,
                  description: payload.description,
                }
              : item,
          );
      setTimeline(nextTimeline);
      setProject((current) =>
        current
          ? {
              ...current,
              projectStatus: data?.data?.projectStatus ?? current.projectStatus,
              constructionProgress: data?.data?.constructionProgress ?? data?.data?.overallProgress ?? current.constructionProgress,
            }
          : current,
      );
      setTimelineSuccess("Project timeline updated successfully.");
      setIsTimelineModalOpen(false);
    } catch {
      setTimelineError("Network error while updating timeline.");
    } finally {
      setTimelineSubmitting(false);
    }
  };

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

              {/* Exact location requested: Funds Raised card ni niche Project Timeline */}
              <div className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white shadow-sm">
                <div className="border-b border-[#E5E7EB] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f8fafc_100%)] p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563EB]">Project Timeline</p>
                        <h3 className="mt-2 text-xl font-semibold text-[#111827]">Construction Progress</h3>
                        <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                          Track each construction stage and keep investors updated with the latest project progress.
                        </p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#DBEAFE]">
                        <Clock3 className="text-[#2563EB]" size={22} />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#DBEAFE] bg-white/90 p-4">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-sm text-[#6B7280]">Overall Project Progress</p>
                          <p className="mt-1 text-3xl font-semibold text-[#111827]">{overallTimelineProgress}%</p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            setTimelineForm({
                              stage: timeline[0]?.stage ?? "Foundation",
                              status: timeline[0]?.status ?? "pending",
                              progress: timeline[0]?.progress ?? 0,
                              description: timeline[0]?.description ?? "",
                            });
                            setTimelineError("");
                            setTimelineSuccess("");
                            setIsTimelineModalOpen(true);
                          }}
                          className="rounded-xl bg-[#2563EB] font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
                        >
                          Update Timeline
                        </Button>
                      </div>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getTimelineBarClass(overallTimelineProgress)}`}
                          style={{ width: `${overallTimelineProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  {timelineSuccess && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {timelineSuccess}
                    </div>
                  )}
                  {timeline.map((item) => (
                    <TimelineStageCard key={item.stage} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isTimelineModalOpen} onOpenChange={setIsTimelineModalOpen}>
        <DialogContent className="max-w-2xl rounded-[28px] border border-[#E5E7EB] bg-white p-0 shadow-2xl">
          <DialogHeader className="border-b border-[#E5E7EB] bg-slate-50/80 px-6 py-5">
            <DialogTitle className="text-xl text-[#111827]">Update Project Timeline</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#6B7280]">
              Update the selected construction stage and save the latest progress for this project.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTimelineSubmit} className="space-y-5 px-6 py-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <select
                  id="stage"
                  name="stage"
                  value={timelineForm.stage}
                  onChange={handleTimelineStageChange}
                  className="h-11 w-full rounded-xl border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#DBEAFE]"
                >
                  {timelineStageOptions.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={timelineForm.status}
                  onChange={handleTimelineFormChange}
                  className="h-11 w-full rounded-xl border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#DBEAFE]"
                >
                  {timelineStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {getTimelineStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress">Progress Percentage</Label>
              <Input
                id="progress"
                name="progress"
                type="number"
                min={0}
                max={100}
                value={timelineForm.progress}
                onChange={handleTimelineFormChange}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-[#6B7280]">0% shows gray, 1-99% shows yellow, and 100% shows green.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={timelineForm.description}
                onChange={handleTimelineFormChange}
                placeholder="Add a short construction update for this stage"
                className="min-h-[140px] rounded-xl"
              />
            </div>

            {timelineError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {timelineError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTimelineModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={timelineSubmitting}
                className="rounded-xl bg-[#2563EB] font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
              >
                {timelineSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </BuilderLayout>
  );
}
