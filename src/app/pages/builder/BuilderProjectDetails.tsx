import { useEffect, useMemo, useState } from "react";
import { BuilderLayout } from "../../components/layout/BuilderLayout";
import StatusBadge from "../../components/dashboard/StatusBadge";
import { ArrowLeft, Users, IndianRupee, TrendingUp } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { formatINR } from "../../utils/currency";

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
            </div>
          </div>
        )}
      </div>
    </BuilderLayout>
  );
}
