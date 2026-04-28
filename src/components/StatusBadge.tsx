interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusConfig: Record<
  string,
  { bg: string; text: string; border: string; dot?: string; pulse?: boolean; label: string }
> = {
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200/60",
    dot: "bg-emerald-500",
    label: "Active",
  },
  due_soon: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200/60",
    dot: "bg-amber-500",
    label: "Due Soon",
  },
  overdue: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200/60",
    dot: "bg-red-500",
    pulse: true,
    label: "Overdue",
  },
  completed: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200/60",
    label: "Completed",
  },
  pending_confirmation: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200/60",
    label: "Pending",
  },
  archived: {
    bg: "bg-slate-50",
    text: "text-slate-500",
    border: "border-slate-200/60",
    label: "Archived",
  },
  // Verification statuses
  uploaded: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200/60",
    dot: "bg-slate-400",
    label: "Uploaded",
  },
  scanned: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200/60",
    dot: "bg-cyan-500",
    label: "Scanned",
  },
  needs_review: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200/60",
    dot: "bg-orange-500",
    pulse: true,
    label: "Needs Review",
  },
  verified: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200/60",
    dot: "bg-teal-500",
    label: "Verified",
  },
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    bg: "bg-slate-50",
    text: "text-slate-500",
    border: "border-slate-200",
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };

  const sizeClasses = size === "sm"
    ? "px-2 py-0.5 text-[10px]"
    : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold border ${sizeClasses} ${config.bg} ${config.text} ${config.border}`}
    >
      {config.dot && (
        <span className="relative flex h-1.5 w-1.5">
          {config.pulse && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.dot} opacity-75`}
            />
          )}
          <span
            className={`relative inline-flex h-1.5 w-1.5 rounded-full ${config.dot}`}
          />
        </span>
      )}
      {config.label}
    </span>
  );
}
