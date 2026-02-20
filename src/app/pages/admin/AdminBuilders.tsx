import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { CheckCircle, XCircle, Eye } from "lucide-react";

const builders = [
  { id: 1, name: "Elite Constructions", email: "elite@example.com", projects: 15, fundsRaised: "$2.4M", status: "Verified", joinDate: "Jun 2024" },
  { id: 2, name: "Premium Builders", email: "premium@example.com", projects: 10, fundsRaised: "$1.8M", status: "Verified", joinDate: "Aug 2024" },
  { id: 3, name: "New Construction Co.", email: "newco@example.com", projects: 0, fundsRaised: "$0", status: "Pending", joinDate: "Feb 2026" },
  { id: 4, name: "Urban Developers", email: "urban@example.com", projects: 8, fundsRaised: "$1.2M", status: "Verified", joinDate: "Sep 2024" },
];

export default function AdminBuilders() {
  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Builder Management</h1>
          <p className="text-gray-600">Manage and verify builders</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Total Builders</p>
              <p className="mt-2 text-3xl font-semibold">{builders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Verified</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">
                {builders.filter(b => b.status === "Verified").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="mt-2 text-3xl font-semibold text-amber-600">
                {builders.filter(b => b.status === "Pending").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Builders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Funds Raised</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {builders.map((builder) => (
                    <TableRow key={builder.id}>
                      <TableCell className="font-medium">{builder.name}</TableCell>
                      <TableCell>{builder.email}</TableCell>
                      <TableCell>{builder.projects}</TableCell>
                      <TableCell className="font-semibold text-green-600">{builder.fundsRaised}</TableCell>
                      <TableCell>{builder.joinDate}</TableCell>
                      <TableCell>
                        <Badge className={builder.status === "Verified" ? "bg-green-500" : "bg-amber-500"}>
                          {builder.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {builder.status === "Pending" && (
                            <>
                              <Button size="sm" className="bg-green-500 hover:bg-green-600">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
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
