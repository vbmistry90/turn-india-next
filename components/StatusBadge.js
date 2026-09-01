const COLOR_MAP = {
  // video status
  draft: "bg-ink-100 text-ink-600",
  published: "bg-green-100 text-green-700",
  archived: "bg-yellow-100 text-yellow-700",
  // priority
  low: "bg-blue-100 text-blue-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
  // payment status
  success: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
  // contact status
  new: "bg-blue-100 text-blue-700",
  read: "bg-ink-100 text-ink-600",
  resolved: "bg-green-100 text-green-700",
  // active/inactive
  active: "bg-green-100 text-green-700",
  inactive: "bg-ink-100 text-ink-500",
};

export default function StatusBadge({ value }) {
  const classes = COLOR_MAP[value] || "bg-ink-100 text-ink-600";
  return <span className={`badge ${classes} capitalize`}>{value}</span>;
}
