interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<
  string,
  { bg: string; text: string; border: string; dot?: string; pulse?: boolean; label: string }
> = {
  active: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Active",
  },
  due_soon: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Due Soon",
  },
  overdue: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    pulse: true,
    label: "Overdue",
  },
  completed: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    label: "Completed",
  },
  pending_confirmation: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
    label: "Pending Confirmation",
  },
  archived: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    label: "Archived",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.dot && (
        <span className="relative flex h-2 w-2">
          {config.pulse && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.dot} opacity-75`}
            />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${config.dot}`}
          />
        </span>
      )}
      {config.label}
    </span>
  );
}
