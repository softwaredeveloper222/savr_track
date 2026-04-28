"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Search, Filter, Tag } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import Select from "@/components/Select";
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
    <div className="space-y-2 stagger-children">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-100 p-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-4 w-48 shimmer rounded-lg" />
            <div className="h-4 w-24 shimmer rounded-lg" />
            <div className="h-5 w-20 shimmer rounded-lg" />
            <div className="h-4 w-28 shimmer rounded-lg ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-16 text-center animate-fade-in">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        <svg
          className="w-7 h-7 text-slate-400"
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
        Adjust your filters or add a new compliance deadline.
      </p>
      <Link href="/deadlines/new" className="btn-primary">
        <Plus className="h-4 w-4" />
        Add Deadline
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const initialLoad = useRef(true);

  // Debounce search input — wait 400ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchDeadlines = useCallback(async () => {
    // Only show full skeleton on initial load
    if (initialLoad.current) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/deadlines?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDeadlines(data);
      }
    } catch (err) {
      console.error("Failed to fetch deadlines:", err);
    } finally {
      setLoading(false);
      initialLoad.current = false;
    }
  }, [statusFilter, categoryFilter, debouncedSearch]);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deadlines</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage all compliance deadlines</p>
        </div>
        <Link href="/deadlines/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Deadline
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          placeholder="All Statuses"
          icon={<Filter className="h-4 w-4" />}
          className="w-auto min-w-[170px]"
          options={[
            { value: "", label: "All Statuses" },
            ...STATUSES.map((s) => ({ value: s.value, label: s.label })),
          ]}
        />

        <Select
          value={categoryFilter}
          onChange={(v) => setCategoryFilter(v)}
          placeholder="All Categories"
          icon={<Tag className="h-4 w-4" />}
          searchable
          className="w-auto min-w-[180px]"
          options={[
            { value: "", label: "All Categories" },
            ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
          ]}
        />

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search deadlines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton />
      ) : deadlines.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden animate-fade-in" style={{ animationDelay: "200ms" }}>
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1fr_140px_110px_120px_120px_100px] gap-4 px-5 py-3 bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span>Title</span>
            <span>Category</span>
            <span>Status</span>
            <span>Expiration</span>
            <span>Owner</span>
            <span className="text-right">Urgency</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-50">
            {deadlines.map((deadline) => {
              const days = getDaysUntil(new Date(deadline.expirationDate));
              const urgency = getUrgencyLabel(days);
              const borderColor = statusBorderColors[deadline.status] || "border-l-slate-300";

              return (
                <div
                  key={deadline.id}
                  onClick={() => router.push(`/deadlines/${deadline.id}`)}
                  className={`grid grid-cols-1 md:grid-cols-[1fr_140px_110px_120px_120px_100px] gap-2 md:gap-4 px-5 py-3.5 border-l-[3px] ${borderColor} hover:bg-slate-50/50 cursor-pointer transition-colors`}
                >
                  <span className="font-medium text-sm text-slate-900 truncate">
                    {deadline.title}
                  </span>
                  <span className="text-sm text-slate-500 truncate">
                    {getCategoryLabel(deadline.category)}
                  </span>
                  <span>
                    <StatusBadge status={deadline.status} size="sm" />
                  </span>
                  <span className="text-sm text-slate-500">
                    {format(new Date(deadline.expirationDate), "MMM d, yyyy")}
                  </span>
                  <span className="text-sm text-slate-500 truncate">
                    {deadline.owner ? `${deadline.owner.firstName} ${deadline.owner.lastName}` : "Unassigned"}
                  </span>
                  <span
                    className={`text-sm text-right font-semibold ${
                      days < 0
                        ? "text-red-600"
                        : days <= 7
                          ? "text-amber-600"
                          : "text-slate-500"
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
