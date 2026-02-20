import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

export default function AdminNotifications() {
  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Notifications Management</h1>
          <p className="text-gray-600">Send notifications to users</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Type</Label>
                <select id="recipient" className="w-full rounded-lg border p-2">
                  <option>All Users</option>
                  <option>All Investors</option>
                  <option>All Builders</option>
                  <option>Specific User</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Notification Title</Label>
                <Input id="title" placeholder="Enter title..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Enter message..." className="min-h-[150px]" />
              </div>

              <Button className="w-full bg-[#0f3460] hover:bg-[#16426b]">
                Send Notification
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
