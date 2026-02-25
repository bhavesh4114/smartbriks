import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { investorMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { MapPin, Clock, TrendingUp, Building2, DollarSign } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { isKycApproved } from "../../config/kyc";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { formatINR } from "../../utils/currency";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type ProjectTimelineItem = {
  phase: string;
  status: string;
  progress: number;
};

type ProjectDetailsData = {
  id: number;
  project_name: string;
  location: string;
  builder_name: string;
  description: string;
  expected_roi: number;
  project_duration: number | null;
  minimum_investment: number;
  total_project_cost: number;
  funds_raised: number;
  progress_percentage: number;
  start_date: string | null;
  end_date: string | null;
  images: string[];
  amenities: string[];
  timeline: ProjectTimelineItem[];
};

export default function ProjectDetails() {
  const navigate = useNavigate();
  const params = useParams();
  const routeProjectId = params.projectId || params.id;

  const [showInvestDialog, setShowInvestDialog] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [projectDetails, setProjectDetails] = useState<ProjectDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const razorpayKeyFromEnv = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/investor/login", { replace: true });
      return;
    }
    if (!routeProjectId || Number.isNaN(Number(routeProjectId))) {
      setError("Project not found.");
      setLoading(false);
      return;
    }

    const fetchProjectDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const projectPath = `/api/investor/projects/${routeProjectId}`;
        const res = await fetch(projectPath, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          navigate("/investor/login", { replace: true });
          return;
        }
        const json = await res.json().catch(() => ({}));
        console.log("Project Details API response:", { projectId: routeProjectId, status: res.status, body: json });
        if (res.status === 404) {
          setError("Project not found.");
          setProjectDetails(null);
          return;
        }
        if (res.status === 403) {
          setError(json?.message || "Project is not available for investors.");
          setProjectDetails(null);
          return;
        }
        if (!res.ok || json?.success === false) {
          setError(json?.message || "Failed to load project details.");
          setProjectDetails(null);
          return;
        }
        const payload = json?.data || json?.project || null;
        if (!payload) {
          setError("Project not found.");
          setProjectDetails(null);
          return;
        }
        setProjectDetails(payload);
      } catch {
        setError("Network error while loading project details.");
        setProjectDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [navigate, routeProjectId]);

  const handleInvest = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token || !projectDetails) {
      navigate("/investor/login", { replace: true });
      return;
    }

    const amount = Number(investmentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentMessage("Enter a valid investment amount.");
      return;
    }
    if (amount < projectDetails.minimum_investment) {
      setPaymentMessage(`Minimum investment is ${formatINR(projectDetails.minimum_investment)}.`);
      return;
    }
    const remaining = Math.max(0, projectDetails.total_project_cost - projectDetails.funds_raised);
    if (amount > remaining) {
      setPaymentMessage(`Amount exceeds remaining funding ${formatINR(remaining)}.`);
      return;
    }

    const loadRazorpayScript = async () => {
      if (window.Razorpay) return true;
      return new Promise<boolean>((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const startPayment = async () => {
      setIsPaying(true);
      setPaymentMessage("");
      try {
        const orderRes = await fetch("/api/investor/create-order", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: projectDetails.id,
            amount,
          }),
        });
        const orderJson = await orderRes.json().catch(() => ({}));
        if (!orderRes.ok || orderJson?.success === false) {
          setPaymentMessage(orderJson?.message || "Failed to create payment order.");
          return;
        }

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || !window.Razorpay) {
          setPaymentMessage("Unable to load payment gateway. Please try again.");
          return;
        }

        const orderData = orderJson?.data || {};
        const razorpayKey = orderData.keyId || razorpayKeyFromEnv;
        if (!orderData.orderId || !orderData.amount || !razorpayKey) {
          setPaymentMessage("Payment configuration is incomplete. Please contact support.");
          return;
        }

        const options = {
          key: razorpayKey,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "SmartBrick",
          description: "Project Investment",
          order_id: orderData.orderId,
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            const verifyRes = await fetch("/api/investor/verify-payment", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...response,
                projectId: projectDetails.id,
                amount,
              }),
            });
            const verifyJson = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok || verifyJson?.success === false) {
              setPaymentMessage(verifyJson?.message || "Payment verification failed.");
              return;
            }
            setPaymentMessage("Investment successful.");
            setShowInvestDialog(false);
            setInvestmentAmount("");
            navigate("/investor/investments");
          },
          prefill: {},
          theme: { color: "#2563eb" },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          const msg = response?.error?.description || "Payment failed. Please try again.";
          setPaymentMessage(msg);
        });
        rzp.open();
      } catch {
        setPaymentMessage("Unable to start payment. Please try again.");
      } finally {
        setIsPaying(false);
      }
    };

    startPayment();
  };

  const expectedReturns = useMemo(() => {
    const amount = Number(investmentAmount || 0);
    const roi = Number(projectDetails?.expected_roi || 0);
    if (!amount || !roi) return null;
    return amount * (roi / 100);
  }, [investmentAmount, projectDetails?.expected_roi]);

  const toDateLabel = (value: string | null) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <DashboardLayout
        sidebarItems={investorMenuItems}
        userName="John Investor"
        userRole="Investor"
        logoText="RealEstate"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500">
          Loading project details...
        </div>
      </DashboardLayout>
    );
  }

  if (!projectDetails) {
    return (
      <DashboardLayout
        sidebarItems={investorMenuItems}
        userName="John Investor"
        userRole="Investor"
        logoText="RealEstate"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-gray-900 font-medium">Project not found</p>
          <p className="mt-1 text-sm text-gray-500">{error || "This project is unavailable."}</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/investor/projects")}>
            Back to Projects
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarItems={investorMenuItems}
      userName="John Investor"
      userRole="Investor"
      logoText="RealEstate"
    >
      <div className="min-w-0 space-y-5 sm:space-y-6">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-gray-900 sm:text-3xl">{projectDetails.project_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-gray-500 sm:gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {projectDetails.location}
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {projectDetails.builder_name}
            </div>
            <Badge className="bg-emerald-50 text-green-600 border-0">{projectDetails.expected_roi}% ROI</Badge>
          </div>
        </div>

        <Card className="min-w-0 overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm">
          <div className="relative w-full aspect-[16/9] min-h-[220px] overflow-hidden rounded-2xl sm:min-h-[320px] lg:min-h-[440px] lg:max-h-[480px]">
            <img
              src={
                projectDetails.images?.[0]
                  ? `/api/uploads/${projectDetails.images[0]}`
                  : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=400&fit=crop"
              }
              alt={projectDetails.project_name}
              loading="lazy"
              className="block h-full w-full object-cover object-center"
            />
          </div>
        </Card>

        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-4 sm:space-y-6 lg:col-span-2">
            <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Project Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{projectDetails.description}</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid min-w-0 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Expected ROI</p>
                      <p className="text-xl font-semibold text-gray-900">{projectDetails.expected_roi}%</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {projectDetails.project_duration ? `${projectDetails.project_duration} months` : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Min Investment</p>
                      <p className="text-xl font-semibold text-gray-900">{formatINR(projectDetails.minimum_investment)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Project Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectDetails.timeline.map((phase, index) => (
                  <div key={index}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-gray-900">{phase.phase}</span>
                      <Badge
                        variant={phase.status === "Completed" ? "default" : "secondary"}
                        className={
                          phase.status === "Completed"
                            ? "bg-emerald-50 text-green-600 border-0"
                            : phase.status === "In Progress"
                            ? "bg-amber-50 text-amber-700 border-0"
                            : "bg-gray-100 text-gray-600 border-0"
                        }
                      >
                        {phase.status}
                      </Badge>
                    </div>
                    <Progress value={phase.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {(projectDetails.amenities.length ? projectDetails.amenities : ["Not specified"]).map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                      <div className="h-2 w-2 rounded-full bg-green-600" />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-white border-gray-200 rounded-2xl shadow-sm lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="text-gray-900">Investment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm text-gray-500">Raised</span>
                    <span className="font-semibold text-gray-900">{projectDetails.progress_percentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={projectDetails.progress_percentage} className="h-3" />
                  <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <span>{formatINR(projectDetails.funds_raised)}</span>
                    <span>of {formatINR(projectDetails.total_project_cost)}</span>
                  </div>
                </div>

                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expected ROI</span>
                    <span className="font-semibold text-green-600">{projectDetails.expected_roi}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-semibold text-gray-900">
                      {projectDetails.project_duration ? `${projectDetails.project_duration} months` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Min Investment</span>
                    <span className="font-semibold text-gray-900">{formatINR(projectDetails.minimum_investment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Start Date</span>
                    <span className="font-semibold text-gray-900">{toDateLabel(projectDetails.start_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">End Date</span>
                    <span className="font-semibold text-gray-900">{toDateLabel(projectDetails.end_date)}</span>
                  </div>
                </div>

                <Dialog open={showInvestDialog} onOpenChange={setShowInvestDialog}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={(e) => {
                        if (!isKycApproved()) {
                          e.preventDefault();
                          navigate("/investor/kyc/status", { replace: true });
                          return;
                        }
                        setPaymentMessage("");
                      }}
                    >
                      Invest Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto bg-white border-gray-200 rounded-2xl sm:max-h-[85vh] sm:w-full sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900">Invest in {projectDetails.project_name}</DialogTitle>
                      <DialogDescription className="text-gray-500">
                        Enter the amount you want to invest. Minimum investment: {formatINR(projectDetails.minimum_investment)}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Investment Amount (₹)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="5000"
                          value={investmentAmount}
                          onChange={(e) => {
                            setInvestmentAmount(e.target.value);
                            if (paymentMessage) setPaymentMessage("");
                          }}
                          className="border-gray-200"
                        />
                      </div>
                      <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900 border border-blue-100">
                        <p className="font-medium">Investment Summary</p>
                        <div className="mt-2 space-y-1 text-blue-800">
                          <p>Expected Returns: {expectedReturns !== null ? formatINR(expectedReturns) : "-"}</p>
                          <p>
                            Duration:{" "}
                            {projectDetails.project_duration ? `${projectDetails.project_duration} months` : "N/A"}
                          </p>
                          <p>ROI: {projectDetails.expected_roi}%</p>
                        </div>
                      </div>
                      {paymentMessage && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                          {paymentMessage}
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-slate-50">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        onClick={handleInvest}
                        disabled={isPaying}
                        className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                      >
                        {isPaying ? "Processing..." : "Confirm Investment"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
