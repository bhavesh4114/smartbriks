import { BuilderLayout } from "../../components/layout/BuilderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Mail, Phone, Eye, Download } from "lucide-react";

const investors = [
  {
    id: 1,
    name: "John Investor",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    totalInvested: "$27,500",
    projects: 3,
    joinDate: "Jan 15, 2026",
    status: "Active",
  },
  {
    id: 2,
    name: "Sarah Smith",
    email: "sarah@example.com",
    phone: "+1 (555) 234-5678",
    totalInvested: "$18,500",
    projects: 2,
    joinDate: "Dec 10, 2025",
    status: "Active",
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com",
    phone: "+1 (555) 345-6789",
    totalInvested: "$35,000",
    projects: 4,
    joinDate: "Nov 5, 2025",
    status: "Active",
  },
  {
    id: 4,
    name: "Emily Brown",
    email: "emily@example.com",
    phone: "+1 (555) 456-7890",
    totalInvested: "$22,000",
    projects: 3,
    joinDate: "Oct 20, 2025",
    status: "Active",
  },
  {
    id: 5,
    name: "David Wilson",
    email: "david@example.com",
    phone: "+1 (555) 567-8901",
    totalInvested: "$15,000",
    projects: 2,
    joinDate: "Sep 15, 2025",
    status: "Active",
  },
];

export default function BuilderInvestors() {
  return (
    <BuilderLayout>
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">Investor Management</h1>
            <p className="mt-1 text-[#6B7280]">Manage your investors and view their details</p>
          </div>
          <Button className="w-full shrink-0 rounded-xl bg-[#2563EB] font-semibold shadow-sm hover:bg-[#1E40AF] sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export List
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-[#6B7280]">Total Investors</p>
              <p className="mt-2 text-3xl font-semibold text-[#111827]">{investors.length}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-[#6B7280]">Total Invested</p>
              <p className="mt-2 text-3xl font-semibold text-[#16A34A]">
                ${investors.reduce((sum, inv) => sum + parseFloat(inv.totalInvested.replace(/[$,]/g, '')), 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-[#6B7280]">Active Investors</p>
              <p className="mt-2 text-3xl font-semibold text-[#2563EB]">
                {investors.filter(inv => inv.status === "Active").length}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-[#6B7280]">Avg Investment</p>
              <p className="mt-2 text-3xl font-semibold text-[#111827]">
                ${(investors.reduce((sum, inv) => sum + parseFloat(inv.totalInvested.replace(/[$,]/g, '')), 0) / investors.length).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Investors Table */}
        <Card className="min-w-0 rounded-2xl border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-[#E5E7EB]">
            <CardTitle className="text-[#111827]">All Investors</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E5E7EB] hover:bg-transparent">
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Name</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Email</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Phone</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Total Invested</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Projects</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Join Date</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Status</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investors.map((investor) => (
                    <TableRow key={investor.id} className="border-[#E5E7EB] hover:bg-slate-50">
                      <TableCell className="font-medium text-[#111827]">{investor.name}</TableCell>
                      <TableCell className="text-[#6B7280]">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#6B7280]" />
                          {investor.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#6B7280]">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#6B7280]" />
                          {investor.phone}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-[#16A34A]">
                        {investor.totalInvested}
                      </TableCell>
                      <TableCell className="text-[#111827]">{investor.projects}</TableCell>
                      <TableCell className="text-[#6B7280]">{investor.joinDate}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-50 text-green-700 border-0 font-medium">{investor.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-[#2563EB] hover:bg-blue-50 hover:text-[#2563EB]">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Top Investors */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader className="border-b border-[#E5E7EB]">
            <CardTitle className="text-[#111827]">Top Investors</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {investors
                .sort((a, b) => parseFloat(b.totalInvested.replace(/[$,]/g, '')) - parseFloat(a.totalInvested.replace(/[$,]/g, '')))
                .slice(0, 5)
                .map((investor, index) => (
                  <div
                    key={investor.id}
                    className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB] text-white text-xl font-semibold">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-[#111827]">{investor.name}</p>
                        <p className="text-sm text-[#6B7280]">{investor.projects} Projects</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-[#16A34A]">{investor.totalInvested}</p>
                      <p className="text-sm text-[#6B7280]">Total Invested</p>
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
