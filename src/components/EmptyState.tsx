import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-slate-400 mb-4">{icon}</div>
      <h3 className="text-slate-900 text-lg font-semibold mb-1">{title}</h3>
      <p className="text-slate-600 text-sm max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
