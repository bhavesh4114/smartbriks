interface StatusBadgeProps {
  status: "active" | "completed" | "pending" | "paid" | "unpaid" | "approved" | "rejected" | "blocked" | "disabled";
  text?: string;
}

export default function StatusBadge({ status, text }: StatusBadgeProps) {
  const styles = {
    active: "bg-green-50 text-green-700 border-0",
    completed: "bg-blue-50 text-blue-700 border-0",
    pending: "bg-yellow-50 text-yellow-700 border-0",
    paid: "bg-green-50 text-green-700 border-0",
    unpaid: "bg-red-50 text-red-700 border-0",
    approved: "bg-green-50 text-green-700 border-0",
    rejected: "bg-red-50 text-red-700 border-0",
    blocked: "bg-red-50 text-red-700 border-0",
    disabled: "bg-gray-100 text-gray-600 border-0",
  };

  const labels = {
    active: "Active",
    completed: "Completed",
    pending: "Pending",
    paid: "Paid",
    unpaid: "Unpaid",
    approved: "Approved",
    rejected: "Rejected",
    blocked: "Blocked",
    disabled: "Disabled",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {text || labels[status]}
    </span>
  );
}
