import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminMenuItems } from "../../config/menuItems";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";

type NotificationRow = { id: number; type: string; title: string; message: string; time: string; read: boolean };

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [recipient, setRecipient] = useState("All Users");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login", { replace: true });
    const res = await fetch("/api/admin/notifications", { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) return navigate("/login", { replace: true });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.success) setNotifications(data.data?.notifications ?? []);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    setFeedback("");
    setError("");
    const res = await fetch("/api/admin/notifications/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient, title, message }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      setError(data?.message || "Failed to send notification.");
      return;
    }
    setFeedback(data.message || "Notification sent.");
    setTitle("");
    setMessage("");
    fetchNotifications();
  };

  return (
    <DashboardLayout sidebarItems={adminMenuItems} userName="Admin" userRole="Administrator" logoText="RealEstate">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Notifications Management</h1>
          <p className="text-gray-600">Send notifications and review system updates</p>
          {feedback && <p className="mt-2 text-sm text-green-600">{feedback}</p>}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <Card>
          <CardHeader><CardTitle>Send Notification</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Type</Label>
                <select id="recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full rounded-lg border p-2">
                  <option>All Users</option>
                  <option>All Investors</option>
                  <option>All Builders</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Notification Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Enter message..." className="min-h-[150px]" />
              </div>
              <Button className="w-full bg-[#0f3460] hover:bg-[#16426b]">Send Notification</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>System Notifications</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length === 0 && <p className="text-sm text-gray-500">No notifications yet.</p>}
              {notifications.map((item) => (
                <div key={item.id} className={`rounded-xl border p-4 ${!item.read ? "border-l-4 border-l-blue-600 bg-blue-50/40" : ""}`}>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <Badge className={item.type === "warning" ? "bg-amber-50 text-amber-700 border-0" : item.type === "success" ? "bg-green-50 text-green-700 border-0" : "bg-blue-50 text-blue-700 border-0"}>
                      {item.type}
                    </Badge>
                    {!item.read && <Badge className="bg-blue-50 text-blue-700 border-0">New</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{item.message}</p>
                  <p className="mt-2 text-xs text-gray-400">{item.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
