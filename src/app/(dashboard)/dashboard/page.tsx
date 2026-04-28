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
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
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

interface ComplianceInsights {
  hasBusinessType: boolean;
  businessType?: string;
  coveredItems: string[];
  missingItems: { title: string; category: string }[];
  coverageScore: number;
  totalExpected: number;
  totalCovered: number;
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
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
      <div className="h-4 shimmer rounded-lg w-24 mb-3" />
      <div className="h-8 shimmer rounded-lg w-16 mb-1" />
      <div className="h-3 shimmer rounded-lg w-20" />
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
      <div className="h-5 shimmer rounded-lg w-40 mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
          <div className="h-4 shimmer rounded-lg flex-1" />
          <div className="h-4 shimmer rounded-lg w-20" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<ComplianceInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [dashRes, insightsRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/compliance/insights"),
        ]);
        if (!dashRes.ok) throw new Error("Failed to load dashboard data");
        const json = await dashRes.json();
        setData(json);

        if (insightsRes.ok) {
          const insightsJson = await insightsRes.json();
          setInsights(insightsJson);
        }
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
      <div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-800 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-slate-100 rounded-xl w-40 animate-pulse" />
          <div className="h-10 bg-slate-100 rounded-xl w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonList />
          <SkeletonList />
        </div>
      </div>
    );
  }

  const maxCategoryCount = Math.max(...data.byCategory.map((c) => c.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Compliance overview at a glance</p>
        </div>
        <Link href="/deadlines/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Deadline
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in card-hover" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Overdue</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.overdue.count}</p>
          <p className="text-xs text-slate-500 mt-1">Needs attention</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in card-hover" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Due in 7 Days</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.dueSoon7.count}</p>
          <p className="text-xs text-slate-500 mt-1">This week</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in card-hover" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Due in 30 Days</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <CalendarClock className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.dueSoon30.count}</p>
          <p className="text-xs text-slate-500 mt-1">Plan ahead</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in card-hover" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.totalActive}</p>
          <p className="text-xs text-slate-500 mt-1">Being tracked</p>
        </div>
      </div>

      {/* Compliance Insights */}
      {insights?.hasBusinessType && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                insights.coverageScore >= 80 ? "bg-emerald-50" : "bg-amber-50"
              }`}>
                {insights.coverageScore >= 80 ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Compliance Coverage</h2>
                <p className="text-xs text-slate-500">
                  {insights.totalCovered} of {insights.totalExpected} expected items tracked
                </p>
              </div>
            </div>
            <span
              className={`text-3xl font-bold ${
                insights.coverageScore >= 80
                  ? "text-emerald-600"
                  : insights.coverageScore >= 50
                    ? "text-amber-600"
                    : "text-red-600"
              }`}
            >
              {insights.coverageScore}%
            </span>
          </div>

          <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden mb-4">
            <div
              className={`h-2.5 rounded-full animate-progress ${
                insights.coverageScore >= 80
                  ? "bg-emerald-500"
                  : insights.coverageScore >= 50
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${insights.coverageScore}%` }}
            />
          </div>

          {insights.missingItems.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Missing Items
              </h3>
              <div className="space-y-1.5">
                {insights.missingItems.slice(0, 5).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-sm text-slate-700">{item.title}</span>
                    </div>
                    <Link
                      href="/deadlines/new"
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold transition-colors"
                    >
                      Add
                    </Link>
                  </div>
                ))}
                {insights.missingItems.length > 5 && (
                  <p className="text-xs text-slate-400 text-center pt-1">
                    +{insights.missingItems.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}

          {insights.coverageScore === 100 && (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-800">
                All expected compliance items are being tracked
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overdue Section */}
      {data.overdue.count > 0 && (
        <div className="bg-white rounded-2xl shadow-card border border-red-100 p-5 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              Overdue
            </h2>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
              {data.overdue.count}
            </span>
          </div>
          <div className="space-y-2">
            {data.overdue.items.map((item) => {
              const daysOverdue = Math.abs(getDaysUntil(new Date(item.expirationDate)));
              return (
                <Link
                  key={item.id}
                  href={`/deadlines/${item.id}`}
                  className="flex items-center justify-between bg-red-50/50 hover:bg-red-50 rounded-xl px-4 py-3 border border-red-100/50 transition-all group"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate text-sm group-hover:text-red-700 transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">
                        {getCategoryLabel(item.category)}
                      </span>
                      <span className="text-xs text-slate-300">&middot;</span>
                      <span className="text-xs text-slate-500">
                        {item.owner.firstName} {item.owner.lastName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-lg">
                      {daysOverdue}d overdue
                    </span>
                    <ChevronRight className="h-4 w-4 text-red-300 group-hover:text-red-500 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Due Soon & Recently Completed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in" style={{ animationDelay: "350ms" }}>
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Due Soon
            {data.dueSoon14.count > 0 && (
              <span className="text-xs font-medium text-slate-500 ml-2">
                {data.dueSoon14.count} within 14 days
              </span>
            )}
          </h2>
          {data.dueSoon14.items.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nothing due in 14 days</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {data.dueSoon14.items.map((item) => {
                const days = getDaysUntil(new Date(item.expirationDate));
                let borderColor = "border-l-amber-400";
                if (days < 3) borderColor = "border-l-red-400";
                else if (days < 7) borderColor = "border-l-amber-400";

                return (
                  <Link
                    key={item.id}
                    href={`/deadlines/${item.id}`}
                    className={`block border-l-[3px] ${borderColor} bg-slate-50 hover:bg-slate-100 rounded-r-xl px-4 py-3 transition-all group`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate text-sm group-hover:text-teal-700 transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500">
                            {getCategoryLabel(item.category)}
                          </span>
                          <span className="text-xs text-slate-300">&middot;</span>
                          <span className="text-xs text-slate-500">
                            {item.owner.firstName} {item.owner.lastName}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold flex-shrink-0 ml-3 ${
                          days < 3 ? "text-red-600" : days < 7 ? "text-amber-600" : "text-slate-600"
                        }`}
                      >
                        {getUrgencyLabel(days)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Recently Completed
          </h2>
          {data.recentlyCompleted.items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">No recently completed items</p>
            </div>
          ) : (
            <div className="space-y-1">
              {data.recentlyCompleted.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/deadlines/${item.id}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-all group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate group-hover:text-teal-700 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.owner.firstName} {item.owner.lastName}
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
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in" style={{ animationDelay: "450ms" }}>
          <h2 className="text-base font-semibold text-slate-900 mb-4">
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
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal-500 h-2 rounded-full animate-progress"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-8 text-right flex-shrink-0">
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
