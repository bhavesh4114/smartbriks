import { BuilderLayout } from "../../components/layout/BuilderLayout";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Upload } from "lucide-react";

type SubmitStatus = "DRAFT" | "PENDING_APPROVAL";

export default function AddNewProject() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState({
    projectName: "",
    location: "",
    totalCost: "",
    roi: "",
    duration: "",
    minInvestment: "",
    description: "",
    features: "",
  });
  const [projectImages, setProjectImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const submitProject = async (status: SubmitStatus) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/builder/login", { replace: true });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      const payload = new FormData();
      payload.append("status", status);
      payload.append("project_name", formData.projectName);
      payload.append("location", formData.location);
      payload.append("total_project_cost", formData.totalCost);
      payload.append("expected_roi", formData.roi);
      payload.append("project_duration", formData.duration);
      payload.append("minimum_investment", formData.minInvestment);
      payload.append("project_description", formData.description);
      payload.append("key_features", formData.features);
      for (const image of projectImages) {
        payload.append("project_images", image);
      }

      const res = await fetch("/api/builder/projects", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      });
      if (res.status === 401) {
        navigate("/builder/login", { replace: true });
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setMessage({ type: "error", text: data?.message || "Failed to save project." });
        return;
      }
      setMessage({
        type: "success",
        text: status === "DRAFT" ? "Project saved as draft." : "Project submitted for approval.",
      });
      if (status === "PENDING_APPROVAL") {
        setFormData({
          projectName: "",
          location: "",
          totalCost: "",
          roi: "",
          duration: "",
          minInvestment: "",
          description: "",
          features: "",
        });
        setProjectImages([]);
      }
    } catch {
      setMessage({ type: "error", text: "Network error while saving project." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitProject("PENDING_APPROVAL");
  };

  const inputClass =
    "w-full h-11 px-4 bg-white border border-gray-300 rounded-xl text-[#111827] placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors";
  const textareaClass =
    "w-full min-h-[140px] px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#111827] placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors resize-y";

  return (
    <BuilderLayout>
      <div className="min-w-0 mx-auto max-w-4xl pt-2 px-0">
        <div className="mb-8 sm:mb-10">
          <h1 className="break-words text-2xl font-semibold text-[#111827] tracking-tight sm:text-3xl">
            Add New Project
          </h1>
          <p className="mt-2 text-[#6B7280]">
            Fill in the details to list your project for investment
          </p>
          {message && (
            <p className={`mt-3 text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {message.text}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-[#111827] pb-4 border-b border-[#E5E7EB]">
              Basic Information
            </h3>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project Name <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="e.g., Sunrise Luxury Apartments"
                  className={inputClass}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Location <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Andheri West, Mumbai, Maharashtra"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Total Project Cost <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={formData.totalCost}
                  onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
                  placeholder="50000000"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Expected ROI (%) <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={formData.roi}
                  onChange={(e) => setFormData({ ...formData, roi: e.target.value })}
                  placeholder="18"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project Duration <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="24"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Minimum Investment <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={formData.minInvestment}
                  onChange={(e) => setFormData({ ...formData, minInvestment: e.target.value })}
                  placeholder="100000"
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-[#111827] pb-4 border-b border-[#E5E7EB]">
              Project Details
            </h3>
            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project Description <span className="text-red-500 ml-0.5">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your project in detail..."
                  className={textareaClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Key Features (comma separated)
                </label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Swimming pool, Gym, Clubhouse, 24/7 Security"
                  className={textareaClass}
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-[#111827] pb-4 border-b border-[#E5E7EB]">
              Project Images
            </h3>
            <div
              className="mt-6 border-2 border-dashed border-gray-200 rounded-xl p-10 md:p-12 text-center hover:border-blue-600/50 transition-colors cursor-pointer bg-slate-50/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto mb-3 text-[#6B7280]" size={44} />
              <h4 className="text-base font-medium text-[#111827] mb-1">Upload Project Images</h4>
              <p className="text-sm text-[#6B7280] mb-4">
                Drag and drop your images here, or click to browse
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="rounded-xl px-6 py-2.5 h-11 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  setProjectImages(files);
                }}
              />
            </div>
            {projectImages.length > 0 && (
              <p className="mt-3 text-sm text-[#374151]">
                {projectImages.length} file(s) selected
              </p>
            )}
          </section>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => submitProject("DRAFT")}
              className="rounded-xl px-8 py-3 h-11 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save as Draft"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl px-8 py-3 h-11 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </form>
      </div>
    </BuilderLayout>
  );
}
