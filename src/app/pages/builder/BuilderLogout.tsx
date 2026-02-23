import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { LogOut, ArrowLeft } from "lucide-react";

export default function BuilderLogout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const handleCancel = () => {
    navigate("/builder/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f3460] to-[#1e5a8e] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <LogOut className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Logout Confirmation</CardTitle>
          <CardDescription>
            Are you sure you want to logout from your builder account?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
            <p>
              You will need to login again to access your dashboard, projects, and other features.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCancel}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
