import { useEffect, useMemo, useState } from "react";
import { BuilderLayout } from "../../components/layout/BuilderLayout";
import StatusBadge from "../../components/dashboard/StatusBadge";
import { Edit, Eye, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router";

type BuilderProject = {
  id: number;
  title: string;
  location: string;
  totalValue: number | string | null;
  expectedROI: number | string | null;
  projectStatus: string;
  totalInvested?: number | string | null;
  investmentCount?: number | null;
};

type ProjectRow = {
  id: number;
  name: string;
  location: string;
  investors: number;
  roi: number;
  status: "active" | "completed" | "pending" | "approved" | "rejected" | "disabled";
  progress: number;
};

const statusToBadge = (status: string): ProjectRow["status"] => {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
    case "FUNDED":
      return "active";
    case "COMPLETED":
      return "completed";
    case "PENDING_APPROVAL":
      return "pending";
    case "REJECTED":
      return "rejected";
    case "DRAFT":
    default:
      return "disabled";
  }
};

export default function BuilderProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<BuilderProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/builder/login", { replace: true });
      return;
    }

    const fetchProjects = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/builders/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          navigate("/builder/login", { replace: true });
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

    fetchProjects();
  }, [navigate]);

  const rows = useMemo<ProjectRow[]>(() => {
    return projects.map((project) => {
      const totalValue = Number(project.totalValue ?? 0);
      const totalInvested = Number(project.totalInvested ?? 0);
      const progress = totalValue > 0 ? Math.min(100, (totalInvested / totalValue) * 100) : 0;
      return {
        id: project.id,
        name: project.title,
        location: project.location,
        investors: Number(project.investmentCount ?? 0),
        roi: Number(project.expectedROI ?? 0),
        status: statusToBadge(project.projectStatus),
        progress,
      };
    });
  }, [projects]);

  return (
    <BuilderLayout>
      <div className="min-w-0 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">My Projects</h1>
            <p className="mt-1 text-[#6B7280]">Manage your real estate projects</p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <Link
            to="/builder/add-project"
            className="w-full shrink-0 rounded-xl px-6 py-3 bg-[#2563EB] text-white font-semibold shadow-sm hover:bg-[#1E40AF] transition-colors text-center sm:w-auto"
          >
            Add New Project
          </Link>
        </div>

        {/* Projects Table */}
        <div className="min-w-0 bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                    Project Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                    Funding Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                    Investors
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                    ROI
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {rows.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#111827]">{project.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#6B7280]">{project.location}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#6B7280]">{project.progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#2563EB] h-2 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#111827]">{project.investors}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-[#16A34A] font-medium">
                        <TrendingUp size={16} />
                        {project.roi}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/builder/project/${project.id}`}
                          className="p-2 text-[#2563EB] hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          <Eye size={18} />
                        </Link>
                        <button className="p-2 text-[#6B7280] hover:bg-slate-100 rounded-xl transition-colors">
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center text-[#6B7280]">
            Loading projects...
          </div>
        )}
        {!loading && rows.length === 0 && !error && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center text-[#6B7280]">
            No projects found yet.
          </div>
        )}
      </div>
    </BuilderLayout>
  );
}
