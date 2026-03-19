"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Edit3,
  CheckCircle,
  UserCheck,
  Upload,
  Bell,
  Archive,
  RefreshCw,
  LucideIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityEntry {
  id: string;
  action: string;
  createdAt: string;
  deadline: {
    id: string;
    title: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface ActionConfig {
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  label: string;
}

const ACTION_MAP: Record<string, ActionConfig> = {
  created: {
    icon: Plus,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
    label: "created",
  },
  updated: {
    icon: Edit3,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    label: "updated",
  },
  completed: {
    icon: CheckCircle,
    bgColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
    label: "marked as completed",
  },
  reassigned: {
    icon: UserCheck,
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
    label: "reassigned",
  },
  document_uploaded: {
    icon: Upload,
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
    label: "uploaded a document for",
  },
  reminder_sent: {
    icon: Bell,
    bgColor: "bg-indigo-100",
    iconColor: "text-indigo-600",
    label: "sent a reminder for",
  },
  archived: {
    icon: Archive,
    bgColor: "bg-slate-100",
    iconColor: "text-slate-600",
    label: "archived",
  },
  renewed: {
    icon: RefreshCw,
    bgColor: "bg-cyan-100",
    iconColor: "text-cyan-600",
    label: "renewed",
  },
};

const DEFAULT_ACTION: ActionConfig = {
  icon: Edit3,
  bgColor: "bg-slate-100",
  iconColor: "text-slate-600",
  label: "performed an action on",
};

function getActionConfig(action: string): ActionConfig {
  return ACTION_MAP[action] || DEFAULT_ACTION;
}

function SkeletonTimeline() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            {i < 5 && <div className="w-0.5 flex-1 bg-slate-100 mt-2" />}
          </div>
          <div className="flex-1 pb-6">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivity();
  }, []);

  async function fetchActivity() {
    try {
      setLoading(true);
      const res = await fetch("/api/activity?limit=50");
      if (!res.ok) throw new Error("Failed to fetch activity");
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load activity"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <SkeletonTimeline />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Archive size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">
            No activity yet
          </h3>
          <p className="text-sm text-slate-500">
            Activity will appear here as your team works on deadlines.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="space-y-0">
            {activities.map((activity, index) => {
              const config = getActionConfig(activity.action);
              const Icon = config.icon;
              const isLast = index === activities.length - 1;
              const userName = `${activity.user.firstName} ${activity.user.lastName}`;

              return (
                <div key={activity.id} className="flex gap-4">
                  {/* Timeline column */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgColor}`}
                    >
                      <Icon size={14} className={config.iconColor} />
                    </div>
                    {!isLast && (
                      <div className="w-0.5 flex-1 bg-slate-100 my-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ${isLast ? "" : "pb-6"}`}>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-900">
                        {userName}
                      </span>{" "}
                      {config.label}{" "}
                      <Link
                        href={`/deadlines/${activity.deadline.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        {activity.deadline.title}
                      </Link>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
