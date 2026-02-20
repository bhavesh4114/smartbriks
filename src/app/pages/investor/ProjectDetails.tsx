import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { investorMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { MapPin, Clock, TrendingUp, Building2, Calendar, DollarSign } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { isKycApproved } from "../../config/kyc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export default function ProjectDetails() {
  const navigate = useNavigate();
  const [showInvestDialog, setShowInvestDialog] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState("");

  const project = {
    name: "Luxury Apartments Downtown",
    location: "Manhattan, New York",
    builder: "Elite Constructions",
    roi: "15%",
    duration: "24 months",
    required: "$500,000",
    raised: "$350,000",
    minInvestment: "$5,000",
    status: "Active",
    startDate: "Jan 2026",
    endDate: "Jan 2028",
    description: "A premium residential project featuring luxury apartments with modern amenities in the heart of Manhattan. This project offers high returns with minimal risk.",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=400&fit=crop",
    amenities: ["Swimming Pool", "Gym", "Parking", "24/7 Security", "Clubhouse", "Garden"],
    timeline: [
      { phase: "Foundation", status: "Completed", progress: 100 },
      { phase: "Structure", status: "In Progress", progress: 60 },
      { phase: "Interiors", status: "Pending", progress: 0 },
      { phase: "Handover", status: "Pending", progress: 0 },
    ]
  };

  const percentage = (350000 / 500000) * 100;

  const handleInvest = () => {
    setShowInvestDialog(false);
    // Handle investment logic
  };

  return (
    <DashboardLayout
      sidebarItems={investorMenuItems}
      userName="John Investor"
      userRole="Investor"
      logoText="RealEstate"
    >
      <div className="min-w-0 space-y-6">
        {/* Header */}
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-gray-900 sm:text-3xl">{project.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-gray-500 sm:gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {project.location}
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {project.builder}
            </div>
            <Badge className="bg-emerald-50 text-green-600 border-0">{project.roi} ROI</Badge>
          </div>
        </div>

        {/* Main Image */}
        <Card className="min-w-0 overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm">
          <div className="relative aspect-video w-full min-h-[200px] sm:aspect-[21/9] sm:min-h-[280px]">
            <img
              src={project.image}
              alt={project.name}
              className="h-full w-full object-cover"
            />
          </div>
        </Card>

        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Left Column - Details */}
          <div className="min-w-0 space-y-4 sm:space-y-6 lg:col-span-2">
            {/* Overview */}
            <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Project Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{project.description}</p>
              </CardContent>
            </Card>

            {/* Key Metrics */}
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
                      <p className="text-xl font-semibold text-gray-900">{project.roi}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="text-xl font-semibold text-gray-900">{project.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Min Investment</p>
                      <p className="text-xl font-semibold text-gray-900">{project.minInvestment}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Project Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.timeline.map((phase, index) => (
                  <div key={index}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-gray-900">{phase.phase}</span>
                      <Badge
                        variant={phase.status === "Completed" ? "default" : "secondary"}
                        className={phase.status === "Completed" ? "bg-emerald-50 text-green-600 border-0" : "bg-gray-100 text-gray-600 border-0"}
                      >
                        {phase.status}
                      </Badge>
                    </div>
                    <Progress value={phase.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {project.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                      <div className="h-2 w-2 rounded-full bg-green-600" />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Investment Widget */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Investment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Funding Progress */}
                <div>
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm text-gray-500">Raised</span>
                    <span className="font-semibold text-gray-900">{percentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={percentage} className="h-3" />
                  <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <span>{project.raised}</span>
                    <span>of {project.required}</span>
                  </div>
                </div>

                {/* Investment Info */}
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expected ROI</span>
                    <span className="font-semibold text-green-600">{project.roi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-semibold text-gray-900">{project.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Min Investment</span>
                    <span className="font-semibold text-gray-900">{project.minInvestment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Start Date</span>
                    <span className="font-semibold text-gray-900">{project.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">End Date</span>
                    <span className="font-semibold text-gray-900">{project.endDate}</span>
                  </div>
                </div>

                <Button
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    if (!isKycApproved()) {
                      navigate("/investor/kyc/status", { replace: true });
                      return;
                    }
                    setShowInvestDialog(true);
                  }}
                >
                  Invest Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Investment Dialog */}
      <Dialog open={showInvestDialog} onOpenChange={setShowInvestDialog}>
        <DialogContent className="bg-white border-gray-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Invest in {project.name}</DialogTitle>
            <DialogDescription className="text-gray-500">
              Enter the amount you want to invest. Minimum investment: {project.minInvestment}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Investment Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="5000"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                className="border-gray-200"
              />
            </div>
            <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900 border border-blue-100">
              <p className="font-medium">Investment Summary</p>
              <div className="mt-2 space-y-1 text-blue-800">
                <p>Expected Returns: {investmentAmount ? `$${(parseFloat(investmentAmount) * 0.15).toFixed(2)}` : "-"}</p>
                <p>Duration: {project.duration}</p>
                <p>ROI: {project.roi}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvestDialog(false)} className="border-gray-200 text-gray-700 hover:bg-slate-50">
              Cancel
            </Button>
            <Button onClick={handleInvest} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              Confirm Investment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
