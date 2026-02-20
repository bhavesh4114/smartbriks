import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { CheckCircle, XCircle, Eye } from "lucide-react";

const projects = [
  { id: 1, name: "Luxury Apartments Downtown", builder: "Elite Constructions", fundsRequired: "$500,000", raised: "$350,000", status: "Active" },
  { id: 2, name: "Green Valley Villas", builder: "Elite Constructions", fundsRequired: "$300,000", raised: "$280,000", status: "Active" },
  { id: 3, name: "Tech Park Phase 2", builder: "New Construction Co.", fundsRequired: "$1,000,000", raised: "$0", status: "Pending Approval" },
  { id: 4, name: "Commercial Plaza", builder: "Premium Builders", fundsRequired: "$1,000,000", raised: "$650,000", status: "Active" },
];

export default function AdminProjects() {
  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Project Management</h1>
          <p className="text-gray-600">Approve and manage projects</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="mt-2 text-3xl font-semibold">{projects.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Active</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">
                {projects.filter(p => p.status === "Active").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="mt-2 text-3xl font-semibold text-amber-600">
                {projects.filter(p => p.status === "Pending Approval").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Builder</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Raised</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => {
                    const percentage = (parseFloat(project.raised.replace(/[$,]/g, '')) / parseFloat(project.fundsRequired.replace(/[$,]/g, ''))) * 100;
                    return (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{project.builder}</TableCell>
                        <TableCell>{project.fundsRequired}</TableCell>
                        <TableCell className="font-semibold text-green-600">{project.raised}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                              <div className="h-full bg-green-500" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <span className="text-sm">{percentage.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={project.status === "Active" ? "bg-green-500" : "bg-amber-500"}>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {project.status === "Pending Approval" && (
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
