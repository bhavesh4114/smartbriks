import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { investorMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { MapPin, Clock, TrendingUp } from "lucide-react";
import { Link } from "react-router";

const projects = [
  {
    id: 1,
    name: "Luxury Apartments Downtown",
    location: "Manhattan, New York",
    roi: "15%",
    duration: "24 months",
    required: "$500,000",
    raised: "$350,000",
    status: "Active",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop"
  },
  {
    id: 2,
    name: "Green Valley Villas",
    location: "Austin, Texas",
    roi: "12%",
    duration: "18 months",
    required: "$300,000",
    raised: "$280,000",
    status: "Active",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop"
  },
  {
    id: 3,
    name: "Commercial Plaza",
    location: "Los Angeles, CA",
    roi: "18%",
    duration: "36 months",
    required: "$1,000,000",
    raised: "$650,000",
    status: "Active",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop"
  },
  {
    id: 4,
    name: "Beachfront Condos",
    location: "Miami, Florida",
    roi: "20%",
    duration: "30 months",
    required: "$750,000",
    raised: "$450,000",
    status: "Active",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop"
  },
  {
    id: 5,
    name: "Tech Park Development",
    location: "San Francisco, CA",
    roi: "16%",
    duration: "24 months",
    required: "$2,000,000",
    raised: "$1,200,000",
    status: "Active",
    image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=400&h=300&fit=crop"
  },
  {
    id: 6,
    name: "Suburban Housing Estate",
    location: "Seattle, WA",
    roi: "14%",
    duration: "20 months",
    required: "$600,000",
    raised: "$500,000",
    status: "Active",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop"
  },
];

export default function ProjectsList() {
  return (
    <DashboardLayout
      sidebarItems={investorMenuItems}
      userName="John Investor"
      userRole="Investor"
      logoText="RealEstate"
    >
      <div className="min-w-0 space-y-6">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold text-gray-900 sm:text-3xl">Available Projects</h1>
            <p className="mt-1 text-gray-500">Browse and invest in real estate projects</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" className="min-h-[44px] border-gray-200 text-gray-700 hover:bg-slate-50">Filter</Button>
            <Button variant="outline" className="min-h-[44px] border-gray-200 text-gray-700 hover:bg-slate-50">Sort</Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid min-w-0 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const percentage = (parseInt(project.raised.replace(/[$,]/g, '')) / parseInt(project.required.replace(/[$,]/g, ''))) * 100;

            return (
              <Card key={project.id} className="min-w-0 overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="relative h-48 min-h-[180px] overflow-hidden sm:h-48">
                  <img
                    src={project.image}
                    alt={project.name}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <CardHeader className="min-w-0">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <CardTitle className="min-w-0 break-words text-lg text-gray-900">{project.name}</CardTitle>
                    <Badge className="bg-emerald-50 text-green-600 border-0">{project.roi}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    {project.location}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{project.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{project.roi} ROI</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-gray-500">Raised: {project.raised}</span>
                      <span className="font-medium text-gray-900">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Required: {project.required}
                    </div>
                  </div>

                  <Link to={`/investor/project/${project.id}`}>
                    <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
