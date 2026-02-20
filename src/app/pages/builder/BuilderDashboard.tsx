import React from "react";
import { BuilderLayout } from "../../components/layout/BuilderLayout";
import { StatCard } from "../../components/shared/StatCard";
import { FolderKanban, Users, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const projectStatusData = [
  { name: "Active", value: 5, color: "#16A34A" },
  { name: "Completed", value: 8, color: "#2563EB" },
  { name: "Pending", value: 2, color: "#F59E0B" },
];

const fundingData = [
  { month: "Jan", raised: 250000, target: 300000 },
  { month: "Feb", raised: 320000, target: 350000 },
  { month: "Mar", raised: 280000, target: 300000 },
  { month: "Apr", raised: 400000, target: 450000 },
  { month: "May", raised: 380000, target: 400000 },
  { month: "Jun", raised: 450000, target: 500000 },
];

export default function BuilderDashboard() {
  return (
    <BuilderLayout>
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">Welcome back, Elite Constructions!</h1>
          <p className="mt-1 text-[#6B7280]">Here's your project overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid min-w-0 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Projects"
            value="15"
            icon={FolderKanban}
            iconBg="bg-blue-50"
            iconTextColor="text-[#2563EB]"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm"
          />
          <StatCard
            title="Total Investors"
            value="142"
            icon={Users}
            iconBg="bg-green-50"
            iconTextColor="text-[#16A34A]"
            trend={{ value: "+12", isPositive: true }}
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm"
          />
          <StatCard
            title="Funds Raised"
            value="$2.4M"
            icon={DollarSign}
            iconBg="bg-orange-50"
            iconTextColor="text-orange-600"
            trend={{ value: "+18%", isPositive: true }}
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm"
          />
          <StatCard
            title="Active Projects"
            value="5"
            icon={TrendingUp}
            iconBg="bg-amber-50"
            iconTextColor="text-amber-600"
            className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm"
          />
        </div>

        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Project Status Chart */}
          <Card className="min-w-0 overflow-hidden bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#111827] font-semibold">Project Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="h-[260px] w-full min-h-[200px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: "12px",
                        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Funding Progress */}
          <Card className="min-w-0 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#111827] font-semibold">Monthly Funding Progress</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="h-[260px] w-full min-h-[200px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fundingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: "12px",
                        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="raised" fill="#2563EB" name="Raised" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" fill="#E5E7EB" name="Target" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#111827] font-semibold">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: "Luxury Apartments Downtown",
                  investors: 45,
                  raised: "$350,000",
                  target: "$500,000",
                  progress: 70,
                  status: "Active",
                },
                {
                  name: "Green Valley Villas",
                  investors: 32,
                  raised: "$280,000",
                  target: "$300,000",
                  progress: 93,
                  status: "Active",
                },
                {
                  name: "Commercial Plaza",
                  investors: 58,
                  raised: "$650,000",
                  target: "$1,000,000",
                  progress: 65,
                  status: "Active",
                },
              ].map((project, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-medium text-[#111827]">{project.name}</p>
                      <Badge className="bg-green-50 text-green-700 border-0">{project.status}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6B7280]">
                      <span>{project.investors} Investors</span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {project.raised} / {project.target}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-[#2563EB]"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-left sm:ml-4 sm:text-right">
                    <div className="text-2xl font-semibold text-[#111827]">{project.progress}%</div>
                    <div className="text-sm text-[#6B7280]">Funded</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Investors */}
        <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#111827] font-semibold">Recent Investors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "John Investor", amount: "$12,000", project: "Luxury Apartments", date: "2 hours ago" },
                { name: "Sarah Smith", amount: "$8,500", project: "Green Valley Villas", date: "5 hours ago" },
                { name: "Mike Johnson", amount: "$15,000", project: "Commercial Plaza", date: "1 day ago" },
                { name: "Emily Brown", amount: "$10,000", project: "Beachfront Condos", date: "2 days ago" },
              ].map((investor, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#2563EB] text-sm font-semibold text-white">
                      {investor.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[#111827] truncate">{investor.name}</p>
                      <p className="text-sm text-[#6B7280] truncate">{investor.project}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="font-semibold text-[#16A34A]">{investor.amount}</p>
                    <p className="text-xs text-[#6B7280]">{investor.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </BuilderLayout>
  );
}
