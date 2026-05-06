import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { formatINR } from "../../utils/currency";

type InvestorRow = {
  id: number;
  name: string;
  email: string;
  total_invested_amount: number;
  total_projects_invested: number;
  kyc_status: "PENDING" | "VERIFIED" | "REJECTED";
  account_status: "ACTIVE" | "BLOCKED";
  created_at: string;
};

type InvestorStats = {
  total_investors: number;
  active_investors: number;
  pending_kyc: number;
  blocked_investors: number;
};

type InvestorDetails = {
  id: number;
  fullName: string;
  email: string;
  mobileNumber: string;
  role: string;
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  summary?: {
    totalInvested: number;
    totalProjects: number;
  };
  profile?: {
    dateOfBirth?: string | null;
    gender?: string | null;
    panNumber?: string | null;
    aadhaarNumber?: string | null;
    resAddressLine1?: string | null;
    resAddressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    permAddressLine1?: string | null;
    permAddressLine2?: string | null;
    permCity?: string | null;
    permState?: string | null;
    permPincode?: string | null;
    bankName?: string | null;
    accountHolderName?: string | null;
    accountNumber?: string | null;
    routingNumber?: string | null;
    swiftCode?: string | null;
    accountType?: string | null;
    upiId?: string | null;
    annualIncome?: string | null;
    occupation?: string | null;
    sourceOfFunds?: string | null;
    riskAppetite?: string | null;
    panCardImage?: string | null;
    aadhaarImage?: string | null;
    bankProofImage?: string | null;
    selfieImage?: string | null;
  } | null;
  kyc?: Array<{
    id: number;
    documentType: string;
    documentNumber: string;
    documentImage: string | null;
    status: string;
    rejectionReason: string | null;
    createdAt: string;
  }>;
  investments?: Array<{
    id: number;
    investedAmount: number | string;
    sharesPurchased: number;
    investmentStatus: string;
    createdAt: string;
    project?: {
      title?: string;
      location?: string;
    };
  }>;
};

export default function AdminInvestors() {
  const navigate = useNavigate();
  const [investors, setInvestors] = useState<InvestorRow[]>([]);
  const [stats, setStats] = useState<InvestorStats>({
    total_investors: 0,
    active_investors: 0,
    pending_kyc: 0,
    blocked_investors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerData, setViewerData] = useState<InvestorDetails | null>(null);

  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const fetchData = async () => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const authHeaders = { Authorization: `Bearer ${token}` };
      const fetchFirstOk = async (urls: string[]) => {
        let lastResponse: Response | null = null;
        for (const url of urls) {
          const res = await fetch(url, { headers: authHeaders });
          if (res.status !== 404) return res;
          lastResponse = res;
        }
        return lastResponse as Response;
      };

      const [investorsRes, statsRes] = await Promise.all([
        fetchFirstOk(["/api/admin/investors", "/api/admin/investor"]),
        fetchFirstOk(["/api/admin/investors/stats", "/api/admin/investor/stats"]),
      ]);
      if ([investorsRes.status, statsRes.status].some((s) => s === 401 || s === 403)) {
        navigate("/login", { replace: true });
        return;
      }

      const investorsJson = await investorsRes.json().catch(() => ({}));
      const statsJson = await statsRes.json().catch(() => ({}));
      console.log("Investor API response", investorsJson);
      console.log("Investor stats API response", statsJson);
      if (!investorsRes.ok || !investorsJson?.success) {
        setError(investorsJson?.message || `Failed to load investors (HTTP ${investorsRes.status}).`);
        return;
      }
      if (!statsRes.ok || !statsJson?.success) {
        setError(statsJson?.message || `Failed to load investor stats (HTTP ${statsRes.status}).`);
        return;
      }
      const investorRows = Array.isArray(investorsJson?.investors)
        ? investorsJson.investors
        : Array.isArray(investorsJson?.data)
        ? investorsJson.data
        : Array.isArray(investorsJson?.users)
        ? investorsJson.users
        : [];
      const statsPayload = statsJson?.stats || statsJson?.data;

      setInvestors(investorRows);
      setStats(statsPayload || {
        total_investors: 0,
        active_investors: 0,
        pending_kyc: 0,
        blocked_investors: 0,
      });
    } catch {
      setError("Network error while loading investors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runAction = async (
    investorId: number,
    action: "verify" | "reject" | "block" | "unblock",
    body?: Record<string, unknown>
  ) => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setBusyId(investorId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/investors/${investorId}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        setError(json?.message || "Action failed.");
        return;
      }
      setSuccess(json?.message || "Action completed.");
      await fetchData();
    } catch {
      setError("Network error while performing action.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt("Enter rejection reason (optional):");
    await runAction(id, "reject", reason?.trim() ? { reason: reason.trim() } : {});
  };

  const handleViewInvestor = async (id: number) => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setViewerOpen(true);
    setViewerLoading(true);
    setViewerData(null);
    try {
      const authHeaders = { Authorization: `Bearer ${token}` };
      const fetchFirstOk = async (urls: string[]) => {
        let lastResponse: Response | null = null;
        for (const url of urls) {
          const res = await fetch(url, { headers: authHeaders });
          if (res.status !== 404) return res;
          lastResponse = res;
        }
        return lastResponse as Response;
      };
      const res = await fetchFirstOk([`/api/admin/investors/${id}`, `/api/admin/investor/${id}`]);
      if (res.status === 401 || res.status === 403) {
        navigate("/login", { replace: true });
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        setError(json?.message || "Failed to load investor details.");
        return;
      }
      setViewerData(json.data ?? null);
    } catch {
      setError("Network error while loading investor details.");
    } finally {
      setViewerLoading(false);
    }
  };

  const fileUrl = (img: string | null | undefined) =>
    img ? `/api/uploads/${img.replace(/^\/+/, "")}` : null;

  const kycClass = (status: InvestorRow["kyc_status"]) =>
    status === "VERIFIED" ? "bg-green-500" : status === "PENDING" ? "bg-amber-500" : "bg-red-500";
  const accountClass = (status: InvestorRow["account_status"]) =>
    status === "ACTIVE" ? "bg-green-500" : "bg-red-500";

  return (
    <DashboardLayout
      sidebarItems={adminMenuItems}
      userName="Admin"
      userRole="Administrator"
      logoText="RealEstate"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Investor Management</h1>
          <p className="text-gray-600">Manage and verify investors</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Total Investors</p>
              <p className="mt-2 text-3xl font-semibold">{stats.total_investors}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Active</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">{stats.active_investors}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.pending_kyc}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">Blocked</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">{stats.blocked_investors}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Investors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Invested</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loading && investors.map((investor) => (
                    <TableRow key={investor.id}>
                      <TableCell className="font-medium">{investor.name}</TableCell>
                      <TableCell>{investor.email}</TableCell>
                      <TableCell className="font-semibold text-green-600">{formatINR(investor.total_invested_amount)}</TableCell>
                      <TableCell>{investor.total_projects_invested}</TableCell>
                      <TableCell>
                        <Badge className={kycClass(investor.kyc_status)}>
                          {investor.kyc_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={accountClass(investor.account_status)}>
                          {investor.account_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewInvestor(investor.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {investor.kyc_status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600"
                                disabled={busyId === investor.id}
                                onClick={() => runAction(investor.id, "verify")}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={busyId === investor.id}
                                onClick={() => handleReject(investor.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {investor.account_status === "ACTIVE" ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={busyId === investor.id}
                              onClick={() => runAction(investor.id, "block")}
                            >
                              Block
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={busyId === investor.id}
                              onClick={() => runAction(investor.id, "unblock")}
                            >
                              Unblock
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        Loading investors...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && investors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        No investors found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      {viewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#111827]">Investor Details</h2>
              <Button variant="outline" size="sm" onClick={() => setViewerOpen(false)}>
                Close
              </Button>
            </div>
            {viewerLoading && <p className="text-sm text-gray-600">Loading...</p>}
            {!viewerLoading && !viewerData && <p className="text-sm text-gray-600">No details found.</p>}
            {!viewerLoading && viewerData && (
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="font-medium">{viewerData.fullName}</p>
                    <p className="mt-2 text-xs text-gray-500">Email</p>
                    <p className="font-medium">{viewerData.email}</p>
                    <p className="mt-2 text-xs text-gray-500">Mobile</p>
                    <p className="font-medium">{viewerData.mobileNumber}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-gray-500">KYC Status</p>
                    <p className="font-medium">{viewerData.kycStatus}</p>
                    <p className="mt-2 text-xs text-gray-500">Account</p>
                    <p className="font-medium">{viewerData.isActive ? "ACTIVE" : "BLOCKED"}</p>
                    <p className="mt-2 text-xs text-gray-500">Total Invested</p>
                    <p className="font-medium">{formatINR(viewerData.summary?.totalInvested ?? 0)}</p>
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-sm font-semibold">Profile & Bank</p>
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <p>DOB: {viewerData.profile?.dateOfBirth || "-"}</p>
                    <p>Gender: {viewerData.profile?.gender || "-"}</p>
                    <p>PAN: {viewerData.profile?.panNumber || "-"}</p>
                    <p>Aadhaar: {viewerData.profile?.aadhaarNumber || "-"}</p>
                    <p>Residential: {[viewerData.profile?.resAddressLine1, viewerData.profile?.resAddressLine2, viewerData.profile?.city, viewerData.profile?.state, viewerData.profile?.zipCode].filter(Boolean).join(", ") || "-"}</p>
                    <p>Permanent: {[viewerData.profile?.permAddressLine1, viewerData.profile?.permAddressLine2, viewerData.profile?.permCity, viewerData.profile?.permState, viewerData.profile?.permPincode].filter(Boolean).join(", ") || "-"}</p>
                    <p>Bank: {viewerData.profile?.bankName || "-"}</p>
                    <p>Holder: {viewerData.profile?.accountHolderName || "-"}</p>
                    <p>Account No: {viewerData.profile?.accountNumber || "-"}</p>
                    <p>IFSC/Routing: {viewerData.profile?.routingNumber || "-"}</p>
                    <p>SWIFT: {viewerData.profile?.swiftCode || "-"}</p>
                    <p>UPI: {viewerData.profile?.upiId || "-"}</p>
                    <p>Income: {viewerData.profile?.annualIncome || "-"}</p>
                    <p>Occupation: {viewerData.profile?.occupation || "-"}</p>
                    <p>Risk: {viewerData.profile?.riskAppetite || "-"}</p>
                    <p>Source: {viewerData.profile?.sourceOfFunds || "-"}</p>
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-sm font-semibold">Uploaded Images</p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "PAN Card", src: fileUrl(viewerData.profile?.panCardImage || null) },
                      { label: "Aadhaar", src: fileUrl(viewerData.profile?.aadhaarImage || null) },
                      { label: "Bank Proof", src: fileUrl(viewerData.profile?.bankProofImage || null) },
                      { label: "Selfie", src: fileUrl(viewerData.profile?.selfieImage || null) },
                    ].map((img) => (
                      <div key={img.label} className="rounded-lg border p-2">
                        <p className="text-xs text-gray-600">{img.label}</p>
                        {img.src ? (
                          <a href={img.src} target="_blank" rel="noreferrer">
                            <img src={img.src} alt={img.label} className="mt-2 h-28 w-full rounded object-cover" />
                          </a>
                        ) : (
                          <div className="mt-2 flex h-28 items-center justify-center rounded border border-dashed text-xs text-gray-500">
                            Not available
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-sm font-semibold">KYC Documents</p>
                  <div className="space-y-2">
                    {(viewerData.kyc || []).map((doc) => (
                      <div key={doc.id} className="rounded border p-2 text-sm">
                        <p>{doc.documentType} • {doc.documentNumber} • {doc.status}</p>
                        {doc.documentImage && (
                          <a
                            href={fileUrl(doc.documentImage) || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View document
                          </a>
                        )}
                      </div>
                    ))}
                    {(viewerData.kyc || []).length === 0 && <p className="text-sm text-gray-500">No KYC docs.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
