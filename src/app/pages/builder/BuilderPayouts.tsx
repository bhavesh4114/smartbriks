import { BuilderLayout } from "../../components/layout/BuilderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { CheckCircle, Clock, DollarSign } from "lucide-react";

const payouts = [
  {
    id: 1,
    project: "Luxury Apartments Downtown",
    investor: "John Investor",
    amount: "$150",
    dueDate: "Feb 1, 2026",
    status: "Paid",
    month: "January 2026",
  },
  {
    id: 2,
    project: "Green Valley Villas",
    investor: "Sarah Smith",
    amount: "$102",
    dueDate: "Feb 1, 2026",
    status: "Paid",
    month: "January 2026",
  },
  {
    id: 3,
    project: "Commercial Plaza",
    investor: "Mike Johnson",
    amount: "$225",
    dueDate: "Feb 15, 2026",
    status: "Pending",
    month: "February 2026",
  },
  {
    id: 4,
    project: "Beachfront Condos",
    investor: "Emily Brown",
    amount: "$167",
    dueDate: "Feb 15, 2026",
    status: "Pending",
    month: "February 2026",
  },
  {
    id: 5,
    project: "Tech Park Development",
    investor: "David Wilson",
    amount: "$133",
    dueDate: "Feb 20, 2026",
    status: "Pending",
    month: "February 2026",
  },
];

export default function BuilderPayouts() {
  const totalPaid = payouts.filter(p => p.status === "Paid").reduce((sum, p) => sum + parseFloat(p.amount.replace(/[$,]/g, '')), 0);
  const totalPending = payouts.filter(p => p.status === "Pending").reduce((sum, p) => sum + parseFloat(p.amount.replace(/[$,]/g, '')), 0);

  return (
    <BuilderLayout>
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">Payout Management</h1>
          <p className="mt-1 text-[#6B7280]">Manage investor returns and payouts</p>
        </div>

        {/* Summary Cards */}
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7280]">Total Paid</p>
                  <p className="mt-2 text-3xl font-semibold text-[#16A34A]">
                    ${totalPaid.toLocaleString()}
                  </p>
                </div>
                <CheckCircle className="h-12 w-12 text-[#16A34A]" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7280]">Pending Payouts</p>
                  <p className="mt-2 text-3xl font-semibold text-[#F59E0B]">
                    ${totalPending.toLocaleString()}
                  </p>
                </div>
                <Clock className="h-12 w-12 text-[#F59E0B]" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7280]">Total Payouts</p>
                  <p className="mt-2 text-3xl font-semibold text-[#2563EB]">
                    ${(totalPaid + totalPending).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-12 w-12 text-[#2563EB]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payouts Table */}
        <Card className="min-w-0 rounded-2xl border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-[#E5E7EB]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-[#111827]">All Payouts</CardTitle>
              <Button className="w-full shrink-0 rounded-xl bg-[#2563EB] font-semibold shadow-sm hover:bg-[#1E40AF] sm:w-auto">
                Process Pending Payouts
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E5E7EB] hover:bg-transparent">
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Project</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Investor</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Period</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Amount</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Due Date</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Status</TableHead>
                    <TableHead className="text-[#6B7280] uppercase tracking-wide">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id} className="border-[#E5E7EB] hover:bg-slate-50">
                      <TableCell className="font-medium text-[#111827]">{payout.project}</TableCell>
                      <TableCell className="text-[#6B7280]">{payout.investor}</TableCell>
                      <TableCell className="text-[#6B7280]">{payout.month}</TableCell>
                      <TableCell className="font-semibold text-[#111827]">{payout.amount}</TableCell>
                      <TableCell className="text-[#6B7280]">{payout.dueDate}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            payout.status === "Paid"
                              ? "bg-green-50 text-green-700 border-0"
                              : "bg-yellow-50 text-yellow-700 border-0"
                          }
                        >
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payout.status === "Pending" && (
                          <Button size="sm" className="rounded-xl bg-[#2563EB] font-semibold hover:bg-[#1E40AF]">
                            Mark as Paid
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

        {/* Payout Calculator */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader className="border-b border-[#E5E7EB]">
            <CardTitle className="text-[#111827]">Calculate Returns</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#374151]">Select Project</label>
                  <select className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-[#111827] focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none">
                    <option>Luxury Apartments Downtown</option>
                    <option>Green Valley Villas</option>
                    <option>Commercial Plaza</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#374151]">Month</label>
                  <select className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-[#111827] focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none">
                    <option>February 2026</option>
                    <option>January 2026</option>
                    <option>December 2025</option>
                  </select>
                </div>
                <Button className="w-full rounded-xl bg-[#2563EB] font-semibold shadow-sm hover:bg-[#1E40AF]">
                  Calculate Returns
                </Button>
              </div>
              <div className="rounded-xl border border-[#E5E7EB] bg-slate-50/50 p-6">
                <h3 className="font-semibold text-[#111827]">Calculation Summary</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Total Invested:</span>
                    <span className="font-medium text-[#111827]">$500,000</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Monthly ROI:</span>
                    <span className="font-medium text-[#111827]">1.25%</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Number of Investors:</span>
                    <span className="font-medium text-[#111827]">45</span>
                  </div>
                  <div className="border-t border-[#E5E7EB] pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-[#111827]">Total Payout:</span>
                      <span className="text-lg font-semibold text-[#16A34A]">$6,250</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </BuilderLayout>
  );
}
