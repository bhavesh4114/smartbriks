import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { StatCard } from "../../components/shared/StatCard";
import { Users, Building2, FolderKanban, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const monthlyData = [
  { month: "Jan", investments: 450000, payouts: 35000, projects: 5 },
  { month: "Feb", investments: 520000, payouts: 42000, projects: 7 },
  { month: "Mar", investments: 480000, payouts: 38000, projects: 6 },
  { month: "Apr", investments: 650000, payouts: 52000, projects: 8 },
  { month: "May", investments: 720000, payouts: 58000, projects: 9 },
  { month: "Jun", investments: 800000, payouts: 65000, projects: 10 },
];

const userDistribution = [
  { name: "Investors", value: 500, color: "#10b981" },
  { name: "Builders", value: 50, color: "#f59e0b" },
  { name: "Admins", value: 5, color: "#0f3460" },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="min-w-0 space-y-6">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-gray-600">Platform overview and analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid min-w-0 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Investors"
            value="500"
            icon={Users}
            iconColor="bg-green-500"
            trend={{ value: "+25", isPositive: true }}
          />
          <StatCard
            title="Total Builders"
            value="50"
            icon={Building2}
            iconColor="bg-orange-500"
            trend={{ value: "+5", isPositive: true }}
          />
          <StatCard
            title="Total Projects"
            value="150"
            icon={FolderKanban}
            iconColor="bg-[#0f3460]"
            trend={{ value: "+10", isPositive: true }}
          />
          <StatCard
            title="Total Investments"
            value="$50M"
            icon={DollarSign}
            iconColor="bg-purple-500"
            trend={{ value: "+15%", isPositive: true }}
          />
        </div>

        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Monthly Investments & Payouts */}
          <Card className="min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle>Monthly Investments & Payouts</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="h-[260px] w-full min-h-[200px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="investments" stroke="#10b981" name="Investments" />
                  <Line type="monotone" dataKey="payouts" stroke="#f59e0b" name="Payouts" />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* User Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Project Creation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="projects" fill="#0f3460" name="New Projects" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { investor: "John Investor", project: "Luxury Apartments", amount: "$12,000", time: "2 hours ago" },
                  { investor: "Sarah Smith", project: "Green Valley Villas", amount: "$8,500", time: "5 hours ago" },
                  { investor: "Mike Johnson", project: "Commercial Plaza", amount: "$15,000", time: "1 day ago" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{item.investor}</p>
                      <p className="text-sm text-gray-600">{item.project}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{item.amount}</p>
                      <p className="text-xs text-gray-500">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { type: "Builder", name: "New Construction Co.", item: "Registration", time: "1 hour ago" },
                  { type: "Project", name: "Tech Park Phase 2", item: "Project Approval", time: "3 hours ago" },
                  { type: "Document", name: "Building Permit", item: "Document Verification", time: "1 day ago" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.item}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-600">{item.type}</p>
                      <p className="text-xs text-gray-500">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
