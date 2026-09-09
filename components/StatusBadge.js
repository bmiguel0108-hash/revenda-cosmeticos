import { STATUS_LABELS, STATUS_CLASSES } from "@/lib/format";

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_CLASSES[status] || "bg-gray-100 text-gray-500"}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
