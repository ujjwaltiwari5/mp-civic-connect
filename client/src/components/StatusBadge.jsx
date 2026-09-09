export const STATUS_META = {
  submitted: { label: "Submitted", classes: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  assigned: { label: "Assigned", classes: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  in_progress: { label: "In Progress", classes: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  resolved: { label: "Resolved", classes: "bg-green-100 text-green-700", dot: "bg-green-500" },
  rejected: { label: "Rejected", classes: "bg-red-100 text-red-700", dot: "bg-red-500" },
    closed: { label: "Closed", classes: "bg-slate-200 text-slate-700", dot: "bg-slate-500" },
};

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || {
    label: status,
    classes: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${meta.classes}`}
    >
      {meta.label}
    </span>
  );
}
