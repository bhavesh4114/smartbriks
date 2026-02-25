import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { investorMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { MapPin, Clock, TrendingUp } from "lucide-react";
import { formatINR } from "../../utils/currency";

type InvestorProject = {
  id: number;
  projectName: string;
  location: string;
  expectedRoi: string;
  projectDuration: number | null;
  required: number;
  raised: number;
  progress: number;
  status: string;
  images: string[];
};

export default function ProjectsList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<InvestorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/investor/login", { replace: true });
      return;
    }
    const fetchProjects = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/investor/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          navigate("/investor/login", { replace: true });
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          setError(data?.message || "Failed to load projects.");
          return;
        }
        setProjects(Array.isArray(data.data) ? data.data : []);
      } catch {
        setError("Network error while loading projects.");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [navigate]);

  const toMoney = (v: number) => formatINR(v || 0);

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
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" className="min-h-[44px] border-gray-200 text-gray-700 hover:bg-slate-50">Filter</Button>
            <Button variant="outline" className="min-h-[44px] border-gray-200 text-gray-700 hover:bg-slate-50">Sort</Button>
          </div>
        </div>

        <div className="grid min-w-0 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {!loading && projects.map((project) => (
            <Card key={project.id} className="min-w-0 overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="relative h-48 min-h-[180px] overflow-hidden sm:h-48">
                <img
                  src={project.images?.[0] ? `/api/uploads/${project.images[0]}` : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop"}
                  alt={project.projectName}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <CardHeader className="min-w-0">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <CardTitle className="min-w-0 break-words text-lg text-gray-900">{project.projectName}</CardTitle>
                  <Badge className="bg-emerald-50 text-green-600 border-0">{project.expectedRoi}%</Badge>
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
                    <span>{project.projectDuration ? `${project.projectDuration} months` : "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{project.expectedRoi}% ROI</span>
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-500">Raised: {toMoney(project.raised)}</span>
                    <span className="font-medium text-gray-900">{project.progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full bg-blue-600" style={{ width: `${project.progress}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Required: {toMoney(project.required)}
                  </div>
                </div>

                <Link to={`/investor/project/${project.id}`}>
                  <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
          {loading && (
            <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500">
              Loading approved projects...
            </div>
          )}
          {!loading && projects.length === 0 && (
            <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500">
              No approved projects available yet.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
