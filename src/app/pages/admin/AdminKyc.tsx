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
  const [viewerDocs, setViewerDocs] = useState<PendingKyc[] | null>(null);
  const [rejectItem, setRejectItem] = useState<PendingKyc | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const getSubjectKey = (item: PendingKyc) =>
    item.builder ? `builder:${item.builder.id}` : `investor:${item.user?.id ?? item.id}`;

  const getDocumentUrl = (docImage: string | null) =>
    docImage ? `/api/uploads/${docImage.replace(/^\/+/, "")}` : null;

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
    setRejectItem(item);
    setRejectReason("");
    setRejectError("");
  };

  const confirmReject = () => {
    if (!rejectItem) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const isBuilder = Boolean(rejectItem.builder);
    if (isBuilder && !rejectReason.trim()) {
      setRejectError("Rejection reason is required for builder.");
      return;
    }
    setActingId(rejectItem.id);
    fetch(`/api/admin/kyc/${rejectItem.id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: rejectReason.trim() }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          fetchPending();
          setRejectItem(null);
          setRejectReason("");
          setRejectError("");
        }
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
                  const imageUrl = getDocumentUrl(item.documentImage);

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
                          <button
                            type="button"
                            onClick={() => {
                              const subjectKey = getSubjectKey(item);
                              const docs = list.filter((entry) => getSubjectKey(entry) === subjectKey);
                              setViewerDocs(docs);
                            }}
                            className="mt-1 inline-block text-xs text-[#2563EB] hover:underline"
                          >
                            View uploaded document
                          </button>
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

      {viewerDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#111827]">Uploaded Documents</h2>
              <Button variant="outline" size="sm" onClick={() => setViewerDocs(null)}>
                Close
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {viewerDocs.map((doc) => {
                const imageUrl = getDocumentUrl(doc.documentImage);
                return (
                  <div key={doc.id} className="rounded-xl border border-[#E5E7EB] p-3">
                    <p className="text-sm font-medium text-[#111827]">{doc.documentType}</p>
                    <p className="text-xs text-[#6B7280] break-all">{doc.documentNumber}</p>
                    {imageUrl ? (
                      <a href={imageUrl} target="_blank" rel="noreferrer" className="mt-2 block">
                        <img
                          src={imageUrl}
                          alt={doc.documentType}
                          className="h-36 w-full rounded-lg border border-[#E5E7EB] object-cover"
                        />
                      </a>
                    ) : (
                      <div className="mt-2 flex h-36 items-center justify-center rounded-lg border border-dashed border-[#D1D5DB] text-xs text-[#6B7280]">
                        No image
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Reject KYC</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">Provide rejection reason</h2>
              <p className="mt-1 text-sm text-slate-600">
                {rejectItem.builder ? "Builder reason is required." : "Reason is optional for investor."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-900">
                {rejectItem.builder ? rejectItem.builder?.companyName : rejectItem.user?.fullName}
              </p>
              <p className="text-xs text-slate-500">
                {rejectItem.builder ? "Builder" : "Investor"} • {rejectItem.documentType}
              </p>
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError("");
              }}
              placeholder="Enter reason..."
              rows={4}
              className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
            {rejectError && <p className="mt-2 text-sm text-red-600">{rejectError}</p>}

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectItem(null);
                  setRejectReason("");
                  setRejectError("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={actingId === rejectItem.id}
                onClick={confirmReject}
              >
                {actingId === rejectItem.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
