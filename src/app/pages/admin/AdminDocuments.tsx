import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { CheckCircle, XCircle, Eye } from "lucide-react";

const documents = [
  { id: 1, name: "Building Permit - Green Valley", builder: "Elite Constructions", type: "Legal", status: "Pending", date: "Feb 1, 2026" },
  { id: 2, name: "Company License", builder: "New Construction Co.", type: "Legal", status: "Pending", date: "Jan 28, 2026" },
  { id: 3, name: "Project Approval", builder: "Premium Builders", type: "Approval", status: "Approved", date: "Jan 15, 2026" },
];

export default function AdminDocuments() {
  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Document Verification</h1>
          <p className="text-gray-600">Verify builder and project documents</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-gray-600">{doc.builder} • {doc.type} • {doc.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={doc.status === "Approved" ? "bg-green-500" : "bg-amber-500"}>
                      {doc.status}
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {doc.status === "Pending" && (
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
