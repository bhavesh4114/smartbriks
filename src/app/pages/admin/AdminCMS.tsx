import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function AdminCMS() {
  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">CMS Pages Management</h1>
          <p className="text-gray-600">Manage website content pages</p>
        </div>

        <Tabs defaultValue="about">
          <TabsList>
            <TabsTrigger value="about">About Us</TabsTrigger>
            <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          </TabsList>

          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About Us Page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter about us content..."
                  className="min-h-[300px]"
                  defaultValue="Welcome to RealEstate Investment Platform..."
                />
                <Button className="bg-[#0f3460] hover:bg-[#16426b]">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terms">
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter terms and conditions..."
                  className="min-h-[300px]"
                  defaultValue="Terms and Conditions..."
                />
                <Button className="bg-[#0f3460] hover:bg-[#16426b]">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter privacy policy..."
                  className="min-h-[300px]"
                  defaultValue="Privacy Policy..."
                />
                <Button className="bg-[#0f3460] hover:bg-[#16426b]">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
