import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { CheckCircle, XCircle, Eye } from "lucide-react";

const investors = [
  { id: 1, name: "John Investor", email: "john@example.com", totalInvested: "$27,500", projects: 3, status: "Active", kycStatus: "Verified" },
  { id: 2, name: "Sarah Smith", email: "sarah@example.com", totalInvested: "$18,500", projects: 2, status: "Active", kycStatus: "Verified" },
  { id: 3, name: "Mike Johnson", email: "mike@example.com", totalInvested: "$35,000", projects: 4, status: "Active", kycStatus: "Verified" },
  { id: 4, name: "Emily Brown", email: "emily@example.com", totalInvested: "$22,000", projects: 3, status: "Pending", kycStatus: "Pending" },
  { id: 5, name: "David Wilson", email: "david@example.com", totalInvested: "$15,000", projects: 2, status: "Blocked", kycStatus: "Rejected" },
];

export default function AdminInvestors() {
  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Investor Management</h1>
          <p className="text-gray-600">Manage and verify investors</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Total Investors</p>
              <p className="mt-2 text-3xl font-semibold">{investors.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Active</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">
                {investors.filter(i => i.status === "Active").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="mt-2 text-3xl font-semibold text-amber-600">
                {investors.filter(i => i.status === "Pending").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Blocked</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">
                {investors.filter(i => i.status === "Blocked").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Investors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Invested</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investors.map((investor) => (
                    <TableRow key={investor.id}>
                      <TableCell className="font-medium">{investor.name}</TableCell>
                      <TableCell>{investor.email}</TableCell>
                      <TableCell className="font-semibold text-green-600">{investor.totalInvested}</TableCell>
                      <TableCell>{investor.projects}</TableCell>
                      <TableCell>
                        <Badge className={investor.kycStatus === "Verified" ? "bg-green-500" : investor.kycStatus === "Pending" ? "bg-amber-500" : "bg-red-500"}>
                          {investor.kycStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={investor.status === "Active" ? "bg-green-500" : investor.status === "Pending" ? "bg-amber-500" : "bg-red-500"}>
                          {investor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {investor.status === "Pending" && (
                            <>
                              <Button size="sm" className="bg-green-500 hover:bg-green-600">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {investor.status === "Active" && (
                            <Button size="sm" variant="destructive">
                              Block
                            </Button>
                          )}
                        </div>
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
