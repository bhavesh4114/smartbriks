import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { CheckCircle, XCircle, Shield, Loader2 } from "lucide-react";

type PendingKyc = {
  id: number;
  documentType: string;
  documentNumber: string;
  documentImage: string | null;
  status: string;
  createdAt: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
    mobileNumber: string;
    kycStatus: string;
  };
  builder?: {
    id: number;
    companyName: string;
    contactPerson: string;
    email: string;
    mobileNumber: string;
    kycStatus: string;
  };
};

export default function AdminKyc() {
  const [list, setList] = useState<PendingKyc[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  const fetchPending = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    fetch("/api/admin/kyc/pending", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) setList(data.data);
        else setList([]);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setActingId(id);
    fetch(`/api/admin/kyc/${id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) fetchPending();
      })
      .finally(() => setActingId(null));
  };

  const handleReject = (item: PendingKyc) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const isBuilder = Boolean(item.builder);
    const reason = isBuilder ? window.prompt("Enter rejection reason:") : window.prompt("Enter rejection reason (optional):");
    if (isBuilder && (!reason || !reason.trim())) return;
    setActingId(item.id);
    fetch(`/api/admin/kyc/${item.id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: reason?.trim?.() ?? "" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) fetchPending();
      })
      .finally(() => setActingId(null));
  };

  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">KYC Management</h1>
          <p className="mt-1 text-[#6B7280]">Review and approve builder and investor KYC requests.</p>
        </div>

        <Card className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#111827] font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#2563EB]" />
              Pending KYC Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#6B7280]" />
              </div>
            ) : list.length === 0 ? (
              <p className="py-8 text-center text-[#6B7280]">No pending KYC requests.</p>
            ) : (
              <div className="space-y-4">
                {list.map((item) => {
                  const isBuilder = Boolean(item.builder);
                  const subjectName = isBuilder ? item.builder?.companyName ?? "-" : item.user?.fullName ?? "-";
                  const subjectType = isBuilder ? "Builder" : "Investor";
                  const subjectEmail = isBuilder ? item.builder?.email ?? "" : item.user?.email ?? "";
                  const subjectMobile = isBuilder ? item.builder?.mobileNumber ?? "" : item.user?.mobileNumber ?? "";
                  const imageUrl = item.documentImage
                    ? `/api/uploads/${item.documentImage.replace(/^\/+/, "")}`
                    : null;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-[#111827]">{subjectName}</p>
                        <p className="text-sm text-[#6B7280]">{subjectType}</p>
                        <p className="text-sm text-[#6B7280]">{subjectEmail}</p>
                        <p className="text-sm text-[#6B7280]">{subjectMobile}</p>
                        <p className="mt-1 text-xs text-[#6B7280]">
                          Document: {item.documentType} • {item.documentNumber} • Submitted {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                        {imageUrl && (
                          <a
                            href={imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs text-[#2563EB] hover:underline"
                          >
                            View uploaded document
                          </a>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-800 border-0">Pending</Badge>
                        <Button
                          size="sm"
                          className="bg-[#16A34A] hover:bg-[#15803d]"
                          disabled={actingId === item.id}
                          onClick={() => handleApprove(item.id)}
                        >
                          {actingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          <span className="ml-1">Approve</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actingId === item.id}
                          onClick={() => handleReject(item)}
                        >
                          {actingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          <span className="ml-1">Reject</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
