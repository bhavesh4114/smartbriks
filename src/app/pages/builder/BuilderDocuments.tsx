import { BuilderLayout } from "../../components/layout/BuilderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Upload, FileText, CheckCircle, Clock, Trash2 } from "lucide-react";
import { useState } from "react";

export default function BuilderDocuments() {
  const [, setSelectedFile] = useState<File | null>(null);

  const documents = [
    { id: 1, name: "Company License", type: "Legal", status: "Approved", date: "Jan 5, 2026", size: "2.4 MB" },
    { id: 2, name: "Project Approval - Luxury Apartments", type: "Approval", status: "Approved", date: "Jan 15, 2026", size: "1.8 MB" },
    { id: 3, name: "Building Permit - Green Valley", type: "Legal", status: "Pending", date: "Feb 1, 2026", size: "1.2 MB" },
    { id: 4, name: "Environmental Clearance", type: "Clearance", status: "Approved", date: "Dec 20, 2025", size: "3.1 MB" },
  ];

  return (
    <BuilderLayout>
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-[#111827] sm:text-3xl">Upload Documents</h1>
          <p className="mt-1 text-[#6B7280]">Manage project approvals and legal documents</p>
        </div>

        {/* Upload Section */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader className="border-b border-[#E5E7EB]">
            <CardTitle className="text-[#111827]">Upload New Document</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E7EB] p-12 hover:border-[#2563EB] transition-colors">
                <Upload className="h-12 w-12 text-[#6B7280]" />
                <p className="mt-2 font-medium text-[#111827]">Click to upload or drag and drop</p>
                <p className="text-sm text-[#6B7280]">PDF, DOC, or Image files (Max 10MB)</p>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <Button className="mt-4 rounded-xl bg-[#2563EB] font-semibold shadow-sm hover:bg-[#1E40AF]">
                  Select File
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-[#374151]">Document Type</label>
                  <select className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-[#111827] focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none">
                    <option>Project Approval</option>
                    <option>Legal Document</option>
                    <option>Building Permit</option>
                    <option>Environmental Clearance</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#374151]">Related Project</label>
                  <select className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-[#111827] focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none">
                    <option>Luxury Apartments Downtown</option>
                    <option>Green Valley Villas</option>
                    <option>Commercial Plaza</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader className="border-b border-[#E5E7EB]">
            <CardTitle className="text-[#111827]">Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] p-4 hover:bg-slate-50/50 transition-colors sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                      <FileText className="h-6 w-6 text-[#2563EB]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#111827]">{doc.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-sm text-[#6B7280]">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{doc.date}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        doc.status === "Approved"
                          ? "bg-green-50 text-green-700 border-0"
                          : "bg-yellow-50 text-yellow-700 border-0"
                      }
                    >
                      {doc.status === "Approved" ? <CheckCircle className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                      {doc.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-[#DC2626] hover:bg-red-50 hover:text-[#DC2626]">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </BuilderLayout>
  );
}
