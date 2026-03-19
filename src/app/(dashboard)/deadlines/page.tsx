"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import StatusBadge from "@/components/StatusBadge";
import { getCategoryLabel, CATEGORIES, STATUSES } from "@/lib/categories";
import { getDaysUntil, getUrgencyLabel } from "@/lib/deadline-status";

interface Deadline {
  id: string;
  title: string;
  category: string;
  status: string;
  expirationDate: string;
  owner?: { id: string; firstName: string; lastName: string };
}

const statusBorderColors: Record<string, string> = {
  active: "border-l-emerald-500",
  due_soon: "border-l-amber-500",
  overdue: "border-l-red-500",
  completed: "border-l-blue-500",
  pending_confirmation: "border-l-purple-500",
  archived: "border-l-slate-400",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="h-4 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-5 w-20 bg-slate-200 rounded-full" />
            <div className="h-4 w-28 bg-slate-200 rounded ml-auto" />
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">
        No deadlines found
      </h3>
      <p className="text-sm text-slate-500 mb-6">
        Try adjusting your filters or add a new deadline to get started.
      </p>
      <Link
        href="/deadlines/new"
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
      >
        + Quick Add
      </Link>
    </div>
  );
}

export default function DeadlinesPage() {
  const router = useRouter();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchDeadlines = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/deadlines?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDeadlines(data);
      }
    } catch (err) {
      console.error("Failed to fetch deadlines:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, search]);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Deadlines</h1>
        <Link
          href="/deadlines/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
        >
          + Quick Add
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search deadlines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none flex-1 min-w-[200px]"
        />
      </div>

      {/* Table / List */}
      {loading ? (
        <LoadingSkeleton />
      ) : deadlines.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1fr_140px_120px_120px_120px_100px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <span>Title</span>
            <span>Category</span>
            <span>Status</span>
            <span>Expiration</span>
            <span>Owner</span>
            <span className="text-right">Days Left</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {deadlines.map((deadline) => {
              const days = getDaysUntil(new Date(deadline.expirationDate));
              const urgency = getUrgencyLabel(days);
              const borderColor =
                statusBorderColors[deadline.status] || "border-l-slate-300";

              return (
                <div
                  key={deadline.id}
                  onClick={() => router.push(`/deadlines/${deadline.id}`)}
                  className={`grid grid-cols-1 md:grid-cols-[1fr_140px_120px_120px_120px_100px] gap-2 md:gap-4 px-5 py-4 border-l-4 ${borderColor} hover:bg-slate-50 cursor-pointer transition-colors`}
                >
                  <span className="font-medium text-slate-900 truncate">
                    {deadline.title}
                  </span>
                  <span className="text-sm text-slate-600 truncate">
                    {getCategoryLabel(deadline.category)}
                  </span>
                  <span>
                    <StatusBadge status={deadline.status} />
                  </span>
                  <span className="text-sm text-slate-600">
                    {format(new Date(deadline.expirationDate), "MMM d, yyyy")}
                  </span>
                  <span className="text-sm text-slate-600 truncate">
                    {deadline.owner ? `${deadline.owner.firstName} ${deadline.owner.lastName}` : "Unassigned"}
                  </span>
                  <span
                    className={`text-sm text-right font-medium ${
                      days < 0
                        ? "text-red-600"
                        : days <= 7
                          ? "text-amber-600"
                          : "text-slate-600"
                    }`}
                  >
                    {urgency}
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
