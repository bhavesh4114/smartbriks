import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { formatINR } from "../../utils/currency";

type InvestmentRow = {
  id: number;
  investor: string;
  project: string;
  amount: number | string;
  date: string | Date;
};

export default function AdminInvestments() {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<InvestmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvestments = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/investments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          navigate("/login", { replace: true });
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          setError(data?.message || "Failed to load investments.");
          setInvestments([]);
          return;
        }
        setInvestments(Array.isArray(data.data) ? data.data : []);
      } catch {
        setError("Network error while loading investments.");
        setInvestments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, [navigate]);

  const toShortDate = (value: string | Date) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Investment Records</h1>
          <p className="text-gray-600">View all investment transactions</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Investments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loading &&
                    investments.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.investor}</TableCell>
                        <TableCell>{inv.project}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatINR(inv.amount)}
                        </TableCell>
                        <TableCell>{toShortDate(inv.date)}</TableCell>
                      </TableRow>
                    ))}
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        Loading investments...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && investments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        No investments found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
