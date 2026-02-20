import { BuilderLayout } from "../../components/layout/BuilderLayout";
import StatusBadge from "../../components/dashboard/StatusBadge";
import { Edit, Eye, TrendingUp } from "lucide-react";
import { Link } from "react-router";

const projects = [
  {
    id: 1,
    name: "Sunrise Luxury Apartments",
    location: "Mumbai",
    totalCost: "₹5,00,00,000",
    raised: "₹3,50,00,000",
    investors: 142,
    roi: "18%",
    status: "active" as const,
    progress: 70,
  },
  {
    id: 2,
    name: "Green Valley Villas",
    location: "Bangalore",
    totalCost: "₹8,00,00,000",
    raised: "₹5,60,00,000",
    investors: 98,
    roi: "22%",
    status: "active" as const,
    progress: 70,
  },
  {
    id: 3,
    name: "Ocean View Towers",
    location: "Goa",
    totalCost: "₹6,50,00,000",
    raised: "₹4,20,00,000",
    investors: 76,
    roi: "20%",
    status: "active" as const,
    progress: 65,
  },
  {
    id: 4,
    name: "Metro Plaza Complex",
    location: "Delhi NCR",
    totalCost: "₹10,00,00,000",
    raised: "₹10,00,00,000",
    investors: 215,
    roi: "24%",
    status: "completed" as const,
    progress: 100,
  },
  {
    id: 5,
    name: "Riverside Residency",
    location: "Hyderabad",
    totalCost: "₹7,00,00,000",
    raised: "₹1,20,00,000",
    investors: 45,
    roi: "19%",
    status: "pending" as const,
    progress: 17,
  },
];

export default function BuilderProjectList() {
  return (
    <BuilderLayout>
      <div className="min-w-0 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">My Projects</h1>
            <p className="mt-1 text-[#6B7280]">Manage your real estate projects</p>
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
                {projects.map((project) => (
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
                          <span className="text-[#6B7280]">{project.progress}%</span>
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
                        {project.roi}
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
      </div>
    </BuilderLayout>
  );
}
