import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

const payouts = [
  { id: 1, project: "Luxury Apartments", investor: "John Investor", amount: "$150", date: "Feb 1, 2026", status: "Paid" },
  { id: 2, project: "Green Valley Villas", investor: "Sarah Smith", amount: "$102", date: "Feb 1, 2026", status: "Paid" },
  { id: 3, project: "Commercial Plaza", investor: "Mike Johnson", amount: "$225", date: "Feb 15, 2026", status: "Pending" },
];

export default function AdminPayouts() {
  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Payout Records</h1>
          <p className="text-gray-600">Monitor all payout transactions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Investor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{payout.project}</TableCell>
                    <TableCell>{payout.investor}</TableCell>
                    <TableCell className="font-semibold">{payout.amount}</TableCell>
                    <TableCell>{payout.date}</TableCell>
                    <TableCell>
                      <Badge className={payout.status === "Paid" ? "bg-green-500" : "bg-amber-500"}>
                        {payout.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
