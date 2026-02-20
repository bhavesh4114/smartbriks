import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { LogOut, ArrowLeft } from "lucide-react";

export default function InvestorLogout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Perform logout logic here
    navigate("/");
  };

  const handleCancel = () => {
    navigate("/investor/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md bg-white border-gray-200 rounded-2xl shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <LogOut className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">Logout Confirmation</CardTitle>
          <CardDescription className="text-gray-500">
            Are you sure you want to logout from your investor account?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900 border border-blue-100">
            <p>
              You will need to login again to access your dashboard, investments, and other
              features.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-gray-200 text-gray-700 hover:bg-slate-50 rounded-xl"
              onClick={handleCancel}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
