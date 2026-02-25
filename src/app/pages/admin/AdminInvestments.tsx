import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

const investments = [
  { id: 1, investor: "John Investor", project: "Luxury Apartments", amount: "₹12,000", date: "Jan 15, 2026" },
  { id: 2, investor: "Sarah Smith", project: "Green Valley Villas", amount: "₹8,500", date: "Dec 10, 2025" },
  { id: 3, investor: "Mike Johnson", project: "Commercial Plaza", amount: "₹15,000", date: "Nov 5, 2025" },
];

export default function AdminInvestments() {
  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Investment Records</h1>
          <p className="text-gray-600">View all investment transactions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Investments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.investor}</TableCell>
                    <TableCell>{inv.project}</TableCell>
                    <TableCell className="font-semibold text-green-600">{inv.amount}</TableCell>
                    <TableCell>{inv.date}</TableCell>
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
