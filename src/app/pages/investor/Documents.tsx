import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { investorMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { FileText, Download, Eye } from "lucide-react";

const documents = [
  {
    id: 1,
    name: "Investment Agreement - Luxury Apartments",
    type: "Agreement",
    projectName: "Luxury Apartments Downtown",
    date: "Jan 15, 2026",
    size: "2.4 MB",
    status: "Signed",
  },
  {
    id: 2,
    name: "Payment Receipt - Jan 2026",
    type: "Receipt",
    projectName: "Luxury Apartments Downtown",
    date: "Feb 1, 2026",
    size: "156 KB",
    status: "Available",
  },
  {
    id: 3,
    name: "Investment Agreement - Green Valley",
    type: "Agreement",
    projectName: "Green Valley Villas",
    date: "Dec 10, 2025",
    size: "2.1 MB",
    status: "Signed",
  },
  {
    id: 4,
    name: "Payment Receipt - Dec 2025",
    type: "Receipt",
    projectName: "Green Valley Villas",
    date: "Jan 1, 2026",
    size: "148 KB",
    status: "Available",
  },
  {
    id: 5,
    name: "Investment Agreement - Commercial Plaza",
    type: "Agreement",
    projectName: "Commercial Plaza",
    date: "Nov 5, 2025",
    size: "2.8 MB",
    status: "Signed",
  },
  {
    id: 6,
    name: "Tax Document - 2025",
    type: "Tax",
    projectName: "All Projects",
    date: "Jan 1, 2026",
    size: "512 KB",
    status: "Available",
  },
  {
    id: 7,
    name: "Investment Summary - 2025",
    type: "Report",
    projectName: "All Projects",
    date: "Jan 1, 2026",
    size: "1.2 MB",
    status: "Available",
  },
  {
    id: 8,
    name: "KYC Verification Documents",
    type: "Verification",
    projectName: "Profile",
    date: "Jan 5, 2026",
    size: "3.5 MB",
    status: "Verified",
  },
];

export default function Documents() {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "Agreement":
        return "bg-blue-50 text-blue-600 border-0";
      case "Receipt":
        return "bg-emerald-50 text-green-600 border-0";
      case "Tax":
        return "bg-amber-50 text-amber-600 border-0";
      case "Report":
        return "bg-violet-50 text-violet-600 border-0";
      case "Verification":
        return "bg-red-50 text-red-600 border-0";
      default:
        return "bg-gray-100 text-gray-600 border-0";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Signed":
        return "bg-emerald-50 text-green-600 border-0";
      case "Verified":
        return "bg-blue-50 text-blue-600 border-0";
      case "Available":
        return "bg-gray-100 text-gray-600 border-0";
      default:
        return "bg-gray-100 text-gray-600 border-0";
    }
  };

  return (
    <DashboardLayout
      sidebarItems={investorMenuItems}
      userName="John Investor"
      userRole="Investor"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Documents</h1>
          <p className="text-gray-500">Access your investment documents and receipts</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Documents</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{documents.length}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Agreements</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {documents.filter((d) => d.type === "Agreement").length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Receipts</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {documents.filter((d) => d.type === "Receipt").length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Reports</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {documents.filter((d) => d.type === "Report").length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-violet-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">All Documents</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-slate-50">
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-slate-50">
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                      <FileText className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                        <span>{doc.projectName}</span>
                        <span>•</span>
                        <span>{doc.date}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getTypeColor(doc.type)}>{doc.type}</Badge>
                    <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Document Categories */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Agreements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents
                  .filter((d) => d.type === "Agreement")
                  .slice(0, 3)
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.date}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents
                  .filter((d) => d.type === "Receipt")
                  .slice(0, 3)
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.date}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
