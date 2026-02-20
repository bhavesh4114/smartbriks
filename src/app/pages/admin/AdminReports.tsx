import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Download, FileText } from "lucide-react";

export default function AdminReports() {
  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Reports</h1>
          <p className="text-gray-600">Generate and download reports</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[
            { title: "Monthly Investment Report", description: "Detailed report of all investments for the month", period: "February 2026" },
            { title: "Payout Summary", description: "Summary of all payouts made this month", period: "February 2026" },
            { title: "User Activity Report", description: "Active users and engagement metrics", period: "Last 30 days" },
            { title: "Project Performance", description: "Performance analysis of all active projects", period: "Q1 2026" },
          ].map((report, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{report.description}</p>
                <p className="mt-2 text-sm font-medium text-gray-900">Period: {report.period}</p>
                <Button className="mt-4 w-full bg-[#0f3460] hover:bg-[#16426b]">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
