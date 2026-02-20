import React from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { investorMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Eye, Download } from "lucide-react";
import { Link } from "react-router";

const investments = [
  {
    id: 1,
    projectName: "Luxury Apartments Downtown",
    investedAmount: "$12,000",
    date: "Jan 15, 2026",
    roi: "15%",
    expectedReturns: "$1,800",
    status: "Active",
    duration: "24 months",
    progress: 45,
  },
  {
    id: 2,
    projectName: "Green Valley Villas",
    investedAmount: "$8,500",
    date: "Dec 10, 2025",
    roi: "12%",
    expectedReturns: "$1,020",
    status: "Active",
    duration: "18 months",
    progress: 60,
  },
  {
    id: 3,
    projectName: "Commercial Plaza",
    investedAmount: "$15,000",
    date: "Nov 5, 2025",
    roi: "18%",
    expectedReturns: "$2,700",
    status: "Active",
    duration: "36 months",
    progress: 30,
  },
  {
    id: 4,
    projectName: "Beachfront Condos",
    investedAmount: "$10,000",
    date: "Oct 20, 2025",
    roi: "20%",
    expectedReturns: "$2,000",
    status: "Active",
    duration: "30 months",
    progress: 25,
  },
  {
    id: 5,
    projectName: "Suburban Housing",
    investedAmount: "$7,500",
    date: "Aug 15, 2025",
    roi: "14%",
    expectedReturns: "$1,050",
    status: "Completed",
    duration: "12 months",
    progress: 100,
  },
  {
    id: 6,
    projectName: "Tech Park Development",
    investedAmount: "$20,000",
    date: "Jul 1, 2025",
    roi: "16%",
    expectedReturns: "$3,200",
    status: "Completed",
    duration: "18 months",
    progress: 100,
  },
];

export default function MyInvestments() {
  const activeInvestments = investments.filter(inv => inv.status === "Active");
  const completedInvestments = investments.filter(inv => inv.status === "Completed");
  const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.investedAmount.replace(/[$,]/g, '')), 0);
  const totalReturns = completedInvestments.reduce((sum, inv) => sum + parseFloat(inv.expectedReturns.replace(/[$,]/g, '')), 0);

  return (
    <DashboardLayout
      sidebarItems={investorMenuItems}
      userName="John Investor"
      userRole="Investor"
      logoText="RealEstate"
    >
      <div className="min-w-0 space-y-6">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-gray-900 sm:text-3xl">My Investments</h1>
          <p className="mt-1 text-gray-500">Track and manage your investments</p>
        </div>

        {/* Summary Cards */}
        <div className="grid min-w-0 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Total Invested</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                ${totalInvested.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Active Investments</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {activeInvestments.length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Total Returns (Completed)</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">
                ${totalReturns.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Investments Table */}
        <Card className="min-w-0 overflow-hidden bg-white border-gray-200 rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-gray-900">All Investments</CardTitle>
              <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-slate-50">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-500">Project Name</TableHead>
                    <TableHead className="text-gray-500">Invested Amount</TableHead>
                    <TableHead className="text-gray-500">Date</TableHead>
                    <TableHead className="text-gray-500">ROI</TableHead>
                    <TableHead className="text-gray-500">Expected Returns</TableHead>
                    <TableHead className="text-gray-500">Duration</TableHead>
                    <TableHead className="text-gray-500">Progress</TableHead>
                    <TableHead className="text-gray-500">Status</TableHead>
                    <TableHead className="text-gray-500">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((investment) => (
                    <TableRow key={investment.id} className="border-gray-200">
                      <TableCell className="font-medium text-gray-900">{investment.projectName}</TableCell>
                      <TableCell className="text-gray-600">{investment.investedAmount}</TableCell>
                      <TableCell className="text-gray-600">{investment.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-green-200 bg-emerald-50 text-green-600">
                          {investment.roi}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {investment.expectedReturns}
                      </TableCell>
                      <TableCell className="text-gray-600">{investment.duration}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full ${investment.status === "Completed" ? "bg-green-600" : "bg-blue-600"}`}
                              style={{ width: `${investment.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">{investment.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            investment.status === "Active"
                              ? "bg-blue-50 text-blue-600 border-0"
                              : "bg-emerald-50 text-green-600 border-0"
                          }
                        >
                          {investment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link to={`/investor/project/${investment.id}`}>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
