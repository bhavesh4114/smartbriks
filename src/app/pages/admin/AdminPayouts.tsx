import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { formatINR } from "../../utils/currency";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";

type PayoutRow = {
  id: number | string;
  rowId?: string;
  type?: "REQUEST" | "PAID";
  project: string;
  investor: string;
  amount: number | string;
  date: string | Date;
  status: "Paid" | "Pending";
  builderEmail?: string;
  builderMobile?: string;
  requiredAmount?: number;
  raisedAmount?: number;
  roiPercent?: number;
  roiAmount?: number;
  totalInvestorReturn?: number;
  builderPayoutAmount?: number;
  netAfterRoiReserve?: number;
  progress?: number;
};

export default function AdminPayouts() {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<number | string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PayoutRow | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "deny" | null>(null);
  const [denyReason, setDenyReason] = useState("");

  const fetchPayouts = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/payouts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          navigate("/login", { replace: true });
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          setError(data?.message || "Failed to load payouts.");
          setPayouts([]);
          return;
        }
        setPayouts(Array.isArray(data.data) ? data.data : []);
      } catch {
        setError("Network error while loading payouts.");
        setPayouts([]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchPayouts();
  }, [navigate]);

  const runAction = async () => {
    if (!selectedRequest || !confirmAction) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    if (confirmAction === "deny" && !denyReason.trim()) {
      setError("Deny reason is required.");
      return;
    }
    setBusyId(selectedRequest.id);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/payouts/${selectedRequest.id}/${confirmAction === "approve" ? "approve" : "deny"}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: confirmAction === "deny" ? JSON.stringify({ reason: denyReason.trim() }) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(data?.message || "Failed to update payout request.");
        return;
      }
      setSuccess(data?.message || "Payout request updated.");
      setSelectedRequest(null);
      setConfirmAction(null);
      setDenyReason("");
      await fetchPayouts();
    } catch {
      setError("Network error while updating payout request.");
    } finally {
      setBusyId(null);
    }
  };

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
          <h1 className="text-3xl font-semibold">Payment Approve</h1>
          <p className="text-gray-600">Monitor payout transactions and approval requests</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Investor</TableHead>
                    <TableHead>Raised</TableHead>
                    <TableHead>ROI</TableHead>
                    <TableHead>Builder Payout</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loading &&
                    payouts.map((payout) => (
                      <TableRow key={payout.rowId || payout.id}>
                        <TableCell className="font-medium">{payout.project}</TableCell>
                        <TableCell>{payout.investor}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatINR(payout.raisedAmount ?? payout.amount)}
                        </TableCell>
                        <TableCell>{payout.roiPercent ?? 0}% ({formatINR(payout.roiAmount ?? 0)})</TableCell>
                        <TableCell className="font-semibold">{formatINR(payout.builderPayoutAmount ?? payout.amount)}</TableCell>
                        <TableCell>{toShortDate(payout.date)}</TableCell>
                        <TableCell>
                          <Badge className={payout.status === "Paid" ? "bg-green-500" : "bg-amber-500"}>
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payout.status === "Pending" && payout.type === "REQUEST" ? (
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedRequest(payout)}>Details</Button>
                              <Button
                                size="sm"
                                disabled={busyId === payout.id}
                                className="bg-green-600 text-white hover:bg-green-700"
                                onClick={() => {
                                  setSelectedRequest(payout);
                                  setConfirmAction("approve");
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={busyId === payout.id}
                                onClick={() => {
                                  setSelectedRequest(payout);
                                  setDenyReason("");
                                  setConfirmAction("deny");
                                }}
                              >
                                Deny
                              </Button>
                            </div>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500">
                        Loading payouts...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && payouts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500">
                        No payouts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Dialog open={!!selectedRequest && !confirmAction} onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <DialogContent className="bg-white sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedRequest?.project || "Payout Details"}</DialogTitle>
              <DialogDescription>Funding and ROI calculation before payout approval.</DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-gray-500">Builder</p>
                  <p className="font-medium">{selectedRequest.investor}</p>
                  <p className="mt-1 text-gray-500">{selectedRequest.builderEmail || "-"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-gray-500">Funding Progress</p>
                  <p className="font-medium">{(selectedRequest.progress ?? 0).toFixed(0)}%</p>
                  <p className="mt-1">{formatINR(selectedRequest.raisedAmount ?? 0)} / {formatINR(selectedRequest.requiredAmount ?? 0)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-gray-500">Expected ROI</p>
                  <p className="font-medium">{selectedRequest.roiPercent ?? 0}%</p>
                  <p className="mt-1">ROI Amount: {formatINR(selectedRequest.roiAmount ?? 0)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-gray-500">Builder Payout</p>
                  <p className="font-medium text-green-600">{formatINR(selectedRequest.builderPayoutAmount ?? 0)}</p>
                  <p className="mt-1">Net after ROI reserve: {formatINR(selectedRequest.netAfterRoiReserve ?? 0)}</p>
                </div>
                <div className="rounded-lg border p-3 md:col-span-2">
                  <p className="text-gray-500">Investor Return Estimate</p>
                  <p className="font-medium">{formatINR(selectedRequest.totalInvestorReturn ?? 0)}</p>
                  <p className="mt-1 text-gray-600">Raised amount + expected ROI amount</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>Close</Button>
              <Button className="bg-green-600 text-white hover:bg-green-700" onClick={() => setConfirmAction("approve")}>Approve</Button>
              <Button variant="destructive" onClick={() => setConfirmAction("deny")}>Deny</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog
          open={!!selectedRequest && !!confirmAction}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmAction(null);
              setDenyReason("");
            }
          }}
        >
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{confirmAction === "approve" ? "Approve Payout?" : "Deny Payout?"}</DialogTitle>
              <DialogDescription>
                {confirmAction === "approve"
                  ? `${selectedRequest?.project || "Project"} payout approve karvu chhe? Builder payout ${formatINR(selectedRequest?.builderPayoutAmount ?? 0)}.`
                  : `${selectedRequest?.project || "Project"} payout deny karvu chhe?`}
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-gray-500">Required</p>
                  <p className="text-right font-medium">{formatINR(selectedRequest.requiredAmount ?? 0)}</p>
                  <p className="text-gray-500">Raised</p>
                  <p className="text-right font-medium text-green-700">{formatINR(selectedRequest.raisedAmount ?? 0)}</p>
                  <p className="text-gray-500">ROI</p>
                  <p className="text-right font-medium">{selectedRequest.roiPercent ?? 0}% ({formatINR(selectedRequest.roiAmount ?? 0)})</p>
                  <p className="text-gray-500">Builder Payout</p>
                  <p className="text-right font-semibold">{formatINR(selectedRequest.builderPayoutAmount ?? 0)}</p>
                  <p className="text-gray-500">Investor Return Estimate</p>
                  <p className="text-right font-medium">{formatINR(selectedRequest.totalInvestorReturn ?? 0)}</p>
                </div>
              </div>
            )}
            {confirmAction === "deny" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="denyReason">Deny Reason</label>
                <textarea
                  id="denyReason"
                  value={denyReason}
                  onChange={(e) => setDenyReason(e.target.value)}
                  className="min-h-24 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  placeholder="Enter reason..."
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button
                className={confirmAction === "approve" ? "bg-green-600 text-white hover:bg-green-700" : ""}
                variant={confirmAction === "deny" ? "destructive" : "default"}
                disabled={!!selectedRequest && busyId === selectedRequest.id}
                onClick={runAction}
              >
                {confirmAction === "approve" ? "Confirm Approve" : "Confirm Deny"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
