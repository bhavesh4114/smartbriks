import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { LogOut, ArrowLeft } from "lucide-react";

export default function AdminLogout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  const handleCancel = () => {
    navigate("/admin/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f3460] to-[#1e5a8e] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <LogOut className="h-8 w-8 text-[#0f3460]" />
          </div>
          <CardTitle className="text-2xl">Logout Confirmation</CardTitle>
          <CardDescription>
            Are you sure you want to logout from admin panel?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
            <p>
              You will need to login again to access the admin dashboard and management features.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCancel}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button className="flex-1 bg-[#0f3460] hover:bg-[#16426b]" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
