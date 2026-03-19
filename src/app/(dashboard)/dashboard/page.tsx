"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  CalendarClock,
  CheckCircle2,
  Plus,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { getCategoryLabel } from "@/lib/categories";
import { getDaysUntil, getUrgencyLabel } from "@/lib/deadline-status";

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DeadlineItem {
  id: string;
  title: string;
  category: string;
  expirationDate: string;
  completedAt: string | null;
  status: string;
  owner: Owner;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface DashboardData {
  overdue: { count: number; items: DeadlineItem[] };
  dueSoon7: { count: number; items: DeadlineItem[] };
  dueSoon14: { count: number; items: DeadlineItem[] };
  dueSoon30: { count: number; items: DeadlineItem[] };
  recentlyCompleted: { count: number; items: DeadlineItem[] };
  totalActive: number;
  byCategory: CategoryCount[];
  byOwner: { ownerId: string; ownerName: string; count: number }[];
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
      <div className="h-8 bg-slate-200 rounded w-16 mb-1" />
      <div className="h-3 bg-slate-100 rounded w-20" />
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-pulse">
      <div className="h-5 bg-slate-200 rounded w-40 mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
          <div className="h-4 bg-slate-200 rounded flex-1" />
          <div className="h-4 bg-slate-100 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-800 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="p-6 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-slate-200 rounded w-40 animate-pulse" />
          <div className="h-10 bg-slate-200 rounded w-32 animate-pulse" />
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        {/* List skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonList />
          <SkeletonList />
        </div>
      </div>
    );
  }

  const maxCategoryCount = Math.max(...data.byCategory.map((c) => c.count), 1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link
          href="/deadlines/new"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Quick Add
        </Link>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">Overdue</span>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-900">{data.overdue.count}</p>
          <p className="text-xs text-red-600 mt-1">Needs immediate attention</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-700">Due in 7 Days</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-900">{data.dueSoon7.count}</p>
          <p className="text-xs text-amber-600 mt-1">Coming up this week</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Due in 30 Days</span>
            <CalendarClock className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-900">{data.dueSoon30.count}</p>
          <p className="text-xs text-blue-600 mt-1">Plan ahead</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-700">Active Items</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-900">{data.totalActive}</p>
          <p className="text-xs text-emerald-600 mt-1">Being tracked</p>
        </div>
      </div>

      {/* Overdue Section */}
      {data.overdue.count > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">
              Overdue ({data.overdue.count})
            </h2>
          </div>
          <div className="space-y-2">
            {data.overdue.items.map((item) => {
              const daysOverdue = Math.abs(getDaysUntil(new Date(item.expirationDate)));
              return (
                <Link
                  key={item.id}
                  href={`/deadlines/${item.id}`}
                  className="flex items-center justify-between bg-white/80 hover:bg-white rounded-lg px-4 py-3 border border-red-100 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate group-hover:text-red-700 transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          {getCategoryLabel(item.category)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.owner.firstName} {item.owner.lastName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-sm font-semibold text-red-700">
                      {daysOverdue}d overdue
                    </span>
                    <ChevronRight className="h-4 w-4 text-red-400 group-hover:text-red-600 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Due Soon & Recently Completed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due Soon Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Due Soon
            {data.dueSoon14.count > 0 && (
              <span className="text-sm font-normal text-slate-500 ml-2">
                ({data.dueSoon14.count} items within 14 days)
              </span>
            )}
          </h2>
          {data.dueSoon14.items.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              Nothing due in the next 14 days. You&apos;re all caught up!
            </p>
          ) : (
            <div className="space-y-1">
              {data.dueSoon14.items.map((item) => {
                const days = getDaysUntil(new Date(item.expirationDate));
                let borderColor = "border-l-yellow-400";
                if (days < 3) borderColor = "border-l-red-500";
                else if (days < 7) borderColor = "border-l-amber-500";

                return (
                  <Link
                    key={item.id}
                    href={`/deadlines/${item.id}`}
                    className={`block border-l-4 ${borderColor} bg-slate-50 hover:bg-slate-100 rounded-r-lg px-4 py-3 transition-colors group`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate text-sm group-hover:text-indigo-700 transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500">
                            {getCategoryLabel(item.category)}
                          </span>
                          <span className="text-xs text-slate-400">
                            &middot;
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.owner.firstName} {item.owner.lastName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span
                          className={`text-xs font-semibold ${
                            days < 3
                              ? "text-red-700"
                              : days < 7
                                ? "text-amber-700"
                                : "text-yellow-700"
                          }`}
                        >
                          {getUrgencyLabel(days)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recently Completed Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-fade-in" style={{ animationDelay: "350ms" }}>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Recently Completed
          </h2>
          {data.recentlyCompleted.items.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              No recently completed items.
            </p>
          ) : (
            <div className="space-y-1">
              {data.recentlyCompleted.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/deadlines/${item.id}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate group-hover:text-indigo-700 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Handled by {item.owner.firstName} {item.owner.lastName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-xs text-slate-500">
                      {item.completedAt
                        ? format(new Date(item.completedAt), "MMM d")
                        : "N/A"}
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      {data.byCategory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            By Category
          </h2>
          <div className="space-y-3">
            {data.byCategory
              .sort((a, b) => b.count - a.count)
              .map((cat) => {
                const pct = Math.round((cat.count / maxCategoryCount) * 100);
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-44 truncate flex-shrink-0">
                      {getCategoryLabel(cat.category)}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 w-8 text-right flex-shrink-0">
                      {cat.count}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
