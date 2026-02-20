import { BuilderLayout } from "../../components/layout/BuilderLayout";
import StatusBadge from "../../components/dashboard/StatusBadge";
import { ArrowLeft, Users, DollarSign, TrendingUp } from "lucide-react";
import { Link } from "react-router";

export default function BuilderProjectDetails() {
  const investors = [
    { name: "Rajesh Kumar", amount: "₹2,50,000", date: "Jan 15, 2026" },
    { name: "Priya Sharma", amount: "₹5,00,000", date: "Dec 20, 2025" },
    { name: "Amit Patel", amount: "₹3,00,000", date: "Nov 5, 2025" },
    { name: "Sneha Reddy", amount: "₹1,50,000", date: "Oct 12, 2025" },
  ];

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

        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="min-w-0 bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 md:p-8">
              <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1 className="break-words text-xl font-semibold text-[#111827] mb-2 sm:text-2xl">
                    Sunrise Luxury Apartments
                  </h1>
                  <p className="text-[#6B7280]">Andheri West, Mumbai</p>
                </div>
                <StatusBadge status="active" />
              </div>
              <p className="text-[#6B7280] leading-relaxed">
                Premium residential project featuring 120 units with modern
                amenities including swimming pool, gym, and 24/7 security.
              </p>
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
                    {investors.map((investor, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-[#111827]">{investor.name}</td>
                        <td className="px-6 py-4 font-semibold text-[#111827]">{investor.amount}</td>
                        <td className="px-6 py-4 text-[#6B7280]">{investor.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="text-[#16A34A]" size={24} />
                <div>
                  <p className="text-sm text-[#6B7280]">Funds Raised</p>
                  <p className="text-2xl font-semibold text-[#111827]">₹3.5 Cr</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <Users className="text-[#2563EB]" size={24} />
                <div>
                  <p className="text-sm text-[#6B7280]">Total Investors</p>
                  <p className="text-2xl font-semibold text-[#111827]">142</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="text-[#2563EB]" size={24} />
                <div>
                  <p className="text-sm text-[#6B7280]">Progress</p>
                  <p className="text-2xl font-semibold text-[#111827]">70%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BuilderLayout>
  );
}
