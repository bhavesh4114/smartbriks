import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../components/ui/dialog";

type DocumentRow = {
  id: number;
  name: string;
  owner: string;
  ownerId: number | null;
  ownerType: string;
  type: string;
  status: string;
  date: string | Date;
  documentImage?: string | null;
  documentNumber?: string | null;
};

export default function AdminDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDoc, setActiveDoc] = useState<DocumentRow | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/documents", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          navigate("/login", { replace: true });
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          setError(data?.message || "Failed to load documents.");
          setDocuments([]);
          return;
        }
        setDocuments(Array.isArray(data.data) ? data.data : []);
      } catch {
        setError("Network error while loading documents.");
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [navigate]);

  const toShortDate = (value: string | Date) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const statusLabel = (status: string) => {
    if (status === "VERIFIED") return "Approved";
    if (status === "REJECTED") return "Rejected";
    if (status === "PENDING") return "Pending";
    return status;
  };

  const statusClass = (status: string) =>
    status === "VERIFIED" || status === "Approved"
      ? "bg-green-500"
      : status === "REJECTED"
      ? "bg-red-500"
      : "bg-amber-500";

  const ownerKey = (doc: DocumentRow) =>
    `${doc.ownerType}:${doc.ownerId ?? doc.owner}`.toLowerCase();

  const activeDocs = activeDoc
    ? documents.filter((doc) => ownerKey(doc) === ownerKey(activeDoc))
    : [];

  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Document Verification</h1>
          <p className="text-gray-600">Verify builder and project documents</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!loading &&
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-600">
                        {doc.owner} • {doc.type} • {toShortDate(doc.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusClass(doc.status)}>
                        {statusLabel(doc.status)}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setActiveDoc(doc)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {doc.status === "PENDING" && (
                          <>
                            <Button size="sm" className="bg-green-500 hover:bg-green-600">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              {loading && <p className="text-sm text-gray-500">Loading documents...</p>}
              {!loading && documents.length === 0 && (
                <p className="text-sm text-gray-500">No documents found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!activeDoc} onOpenChange={(open) => !open && setActiveDoc(null)}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto bg-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>
              Review full document information before approving or rejecting.
            </DialogDescription>
          </DialogHeader>
          {activeDoc && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Document</p>
                  <p className="font-medium text-gray-900">{activeDoc.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Owner</p>
                  <p className="font-medium text-gray-900">{activeDoc.owner}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Type</p>
                  <p className="font-medium text-gray-900">{activeDoc.type}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                  <div className="mt-1">
                    <Badge className={statusClass(activeDoc.status)}>{statusLabel(activeDoc.status)}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Submitted</p>
                  <p className="font-medium text-gray-900">{toShortDate(activeDoc.date)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Owner Type</p>
                  <p className="font-medium text-gray-900">{activeDoc.ownerType}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Document No.</p>
                  <p className="font-medium text-gray-900">{activeDoc.documentNumber || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">All Documents</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {activeDocs.map((doc) => {
                    const preview = doc.documentImage ? `/api/uploads/${doc.documentImage}` : null;
                    return (
                      <div key={doc.id} className="rounded-xl border border-gray-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">{doc.type}</p>
                          </div>
                          <Badge className={statusClass(doc.status)}>{statusLabel(doc.status)}</Badge>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">Submitted: {toShortDate(doc.date)}</p>
                        {preview ? (
                          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-slate-50">
                            <img src={preview} alt={doc.name} className="h-40 w-full object-contain" />
                          </div>
                        ) : (
                          <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-slate-50 p-3 text-xs text-gray-500">
                            No preview available.
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {activeDocs.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-slate-50 p-3 text-sm text-gray-500">
                      No documents found for this owner.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
