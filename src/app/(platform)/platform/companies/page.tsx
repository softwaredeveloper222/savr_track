"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  Building2,
  Search,
  Users,
  CalendarClock,
  CheckCircle2,
  Clock,
  Pause,
  ChevronRight,
  Settings,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  businessType: string | null;
  onboardingCompleted: boolean;
  suspended: boolean;
  suspendedAt: string | null;
  suspendedReason: string | null;
  createdAt: string;
  _count: { users: number; deadlines: number };
}

export default function PlatformCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch("/api/platform/companies");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load companies");
        }
        const json = await res.json();
        setCompanies(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchCompanies();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return companies;
    const q = search.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.businessType && c.businessType.toLowerCase().includes(q))
    );
  }, [companies, search]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center animate-fade-in">
        <p className="text-red-800 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Click any company to view details, edit, suspend, or delete
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 animate-fade-in" style={{ animationDelay: "50ms" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
          />
        </div>
      </div>

      {/* Companies grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 h-36">
              <div className="h-4 shimmer rounded w-32 mb-3" />
              <div className="h-3 shimmer rounded w-24 mb-2" />
              <div className="h-3 shimmer rounded w-20" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-12 text-center">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 mb-1">No companies found</h3>
          <p className="text-sm text-slate-500">
            {search ? "Try a different search query." : "No companies registered yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/platform/companies/${c.id}`}
              className={`bg-white rounded-2xl shadow-card border p-5 card-hover transition-all group block ${
                c.suspended ? "border-red-200 bg-red-50/30" : "border-slate-100"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl ${
                    c.suspended
                      ? "bg-gradient-to-br from-slate-400 to-slate-600"
                      : "bg-gradient-to-br from-blue-500 to-blue-700"
                  } flex items-center justify-center shadow-sm`}
                >
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  {c.suspended ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                      <Pause className="w-3 h-3" />
                      Suspended
                    </span>
                  ) : c.onboardingCompleted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                      <Clock className="w-3 h-3" />
                      Onboarding
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 truncate group-hover:text-amber-700 transition-colors" title={c.name}>
                  {c.name}
                </h3>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
              {c.businessType && (
                <p className="text-xs text-slate-500 mt-0.5 capitalize">
                  {c.businessType.replace(/_/g, " ")}
                </p>
              )}
              {c.suspendedReason && (
                <p className="text-xs text-red-600 mt-1 italic truncate" title={c.suspendedReason}>
                  {c.suspendedReason}
                </p>
              )}
              {!c.suspendedReason && c.address && (
                <p className="text-xs text-slate-500 mt-1 truncate">{c.address}</p>
              )}

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{c._count.users}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">users</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                    <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{c._count.deadlines}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">deadlines</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <p className="text-[10px] text-slate-400">
                  Joined {format(new Date(c.createdAt), "MMM d, yyyy")}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 group-hover:text-amber-600 transition-colors">
                  <Settings className="w-3 h-3" />
                  Manage
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
