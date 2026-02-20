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
import { Download, Calendar } from "lucide-react";

const payouts = [
  {
    id: 1,
    projectName: "Luxury Apartments Downtown",
    amount: "$150",
    date: "Feb 1, 2026",
    status: "Paid",
    month: "January 2026",
    transactionId: "TXN001234",
  },
  {
    id: 2,
    projectName: "Green Valley Villas",
    amount: "$102",
    date: "Feb 1, 2026",
    status: "Paid",
    month: "January 2026",
    transactionId: "TXN001235",
  },
  {
    id: 3,
    projectName: "Commercial Plaza",
    amount: "$225",
    date: "Feb 1, 2026",
    status: "Paid",
    month: "January 2026",
    transactionId: "TXN001236",
  },
  {
    id: 4,
    projectName: "Beachfront Condos",
    amount: "$167",
    date: "Feb 15, 2026",
    status: "Pending",
    month: "February 2026",
    transactionId: "-",
  },
  {
    id: 5,
    projectName: "Luxury Apartments Downtown",
    amount: "$150",
    date: "Jan 1, 2026",
    status: "Paid",
    month: "December 2025",
    transactionId: "TXN001150",
  },
  {
    id: 6,
    projectName: "Green Valley Villas",
    amount: "$102",
    date: "Jan 1, 2026",
    status: "Paid",
    month: "December 2025",
    transactionId: "TXN001151",
  },
  {
    id: 7,
    projectName: "Commercial Plaza",
    amount: "$225",
    date: "Jan 1, 2026",
    status: "Paid",
    month: "December 2025",
    transactionId: "TXN001152",
  },
  {
    id: 8,
    projectName: "Tech Park Development",
    amount: "$267",
    date: "Mar 1, 2026",
    status: "Pending",
    month: "February 2026",
    transactionId: "-",
  },
];

export default function ReturnsPayouts() {
  const totalPaid = payouts
    .filter(p => p.status === "Paid")
    .reduce((sum, p) => sum + parseFloat(p.amount.replace(/[$,]/g, '')), 0);
  
  const totalPending = payouts
    .filter(p => p.status === "Pending")
    .reduce((sum, p) => sum + parseFloat(p.amount.replace(/[$,]/g, '')), 0);

  return (
    <DashboardLayout
      sidebarItems={investorMenuItems}
      userName="John Investor"
      userRole="Investor"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Returns & Payouts</h1>
          <p className="text-gray-500">Track your monthly returns and payout history</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Paid</p>
                  <p className="mt-2 text-3xl font-semibold text-green-600">
                    ${totalPaid.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                  <Download className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Payouts</p>
                  <p className="mt-2 text-3xl font-semibold text-amber-600">
                    ${totalPending.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Returns</p>
                  <p className="mt-2 text-3xl font-semibold text-blue-600">
                    ${(totalPaid + totalPending).toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <Download className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payouts Table */}
        <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">Payout History</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-slate-50">
                  <Calendar className="mr-2 h-4 w-4" />
                  Filter by Date
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-slate-50">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-500">Project Name</TableHead>
                    <TableHead className="text-gray-500">Period</TableHead>
                    <TableHead className="text-gray-500">Amount</TableHead>
                    <TableHead className="text-gray-500">Date</TableHead>
                    <TableHead className="text-gray-500">Transaction ID</TableHead>
                    <TableHead className="text-gray-500">Status</TableHead>
                    <TableHead className="text-gray-500">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id} className="border-gray-200">
                      <TableCell className="font-medium text-gray-900">{payout.projectName}</TableCell>
                      <TableCell className="text-gray-600">{payout.month}</TableCell>
                      <TableCell className="font-semibold text-gray-900">{payout.amount}</TableCell>
                      <TableCell className="text-gray-600">{payout.date}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-500">
                        {payout.transactionId}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            payout.status === "Paid"
                              ? "bg-emerald-50 text-green-600 border-0"
                              : "bg-amber-50 text-amber-600 border-0"
                          }
                        >
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payout.status === "Paid" && (
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Breakdown */}
        <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Monthly Returns Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { month: "January 2026", amount: "$477", projects: 3, status: "Paid" },
                { month: "February 2026", amount: "$434", projects: 2, status: "Pending" },
                { month: "December 2025", amount: "$477", projects: 3, status: "Paid" },
              ].map((month, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">{month.month}</p>
                    <p className="text-sm text-gray-500">{month.projects} projects</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-gray-900">{month.amount}</p>
                    <Badge
                      className={
                        month.status === "Paid"
                          ? "bg-emerald-50 text-green-600 border-0"
                          : "bg-amber-50 text-amber-600 border-0"
                      }
                    >
                      {month.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
