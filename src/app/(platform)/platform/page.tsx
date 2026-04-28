"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  CalendarClock,
  FileText,
  TrendingUp,
  UserPlus,
  Activity,
  Crown,
} from "lucide-react";

interface PlatformStats {
  totalCompanies: number;
  totalUsers: number;
  totalDeadlines: number;
  totalDocuments: number;
  activeUsersLast30Days: number;
  recentSignups: number;
  deadlinesByStatus: { status: string; count: number }[];
  usersByRole: { role: string; count: number }[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-500" },
  due_soon: { label: "Due Soon", color: "bg-amber-500" },
  overdue: { label: "Overdue", color: "bg-red-500" },
  completed: { label: "Completed", color: "bg-blue-500" },
  archived: { label: "Archived", color: "bg-slate-400" },
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  superadmin: { label: "Super Admin", color: "bg-amber-500" },
  admin: { label: "Admin", color: "bg-teal-500" },
  member: { label: "Member", color: "bg-slate-500" },
  viewer: { label: "Viewer", color: "bg-purple-500" },
};

export default function PlatformOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/platform/stats");
        if (!res.ok) throw new Error("Failed to load platform stats");
        const json = await res.json();
        setStats(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 shimmer rounded-lg w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 h-28">
              <div className="h-3 shimmer rounded w-16 mb-2" />
              <div className="h-8 shimmer rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center animate-fade-in">
        <p className="text-red-800 font-medium">{error}</p>
      </div>
    );
  }

  const maxStatusCount = Math.max(...stats.deadlinesByStatus.map((s) => s.count), 1);
  const maxRoleCount = Math.max(...stats.usersByRole.map((r) => r.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-5 h-5 text-amber-500" />
          <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        </div>
        <p className="text-sm text-slate-500">
          Cross-company stats and activity for the entire Surevia platform
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/platform/companies"
          className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in card-hover group"
          style={{ animationDelay: "50ms" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Companies</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totalCompanies}</p>
          <p className="text-xs text-slate-500 mt-1">Across all tenants</p>
        </Link>

        <Link
          href="/platform/users"
          className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in card-hover group"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
              <Users className="h-4 w-4 text-teal-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
          <p className="text-xs text-slate-500 mt-1">All registered accounts</p>
        </Link>

        <div
          className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in card-hover"
          style={{ animationDelay: "150ms" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadlines</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <CalendarClock className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totalDeadlines}</p>
          <p className="text-xs text-slate-500 mt-1">Tracked items</p>
        </div>

        <div
          className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in card-hover"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Documents</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totalDocuments}</p>
          <p className="text-xs text-slate-500 mt-1">Uploaded files</p>
        </div>
      </div>

      {/* Activity stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">Active Users (30 days)</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.activeUsersLast30Days}</p>
          <p className="text-xs text-slate-500 mt-1">
            of {stats.totalUsers} total ({stats.totalUsers > 0 ? Math.round((stats.activeUsersLast30Days / stats.totalUsers) * 100) : 0}% engagement)
          </p>
          <div className="mt-3 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full animate-progress"
              style={{ width: `${stats.totalUsers > 0 ? (stats.activeUsersLast30Days / stats.totalUsers) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">New Signups (30 days)</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.recentSignups}</p>
          <p className="text-xs text-slate-500 mt-1">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Recent platform growth
          </p>
        </div>
      </div>

      {/* Distribution charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in" style={{ animationDelay: "350ms" }}>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Users by Role</h3>
          <div className="space-y-3">
            {stats.usersByRole
              .sort((a, b) => b.count - a.count)
              .map((r) => {
                const config = ROLE_LABELS[r.role] || { label: r.role, color: "bg-slate-400" };
                const pct = (r.count / maxRoleCount) * 100;
                return (
                  <div key={r.role}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700">{config.label}</span>
                      <span className="text-sm font-semibold text-slate-900">{r.count}</span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full animate-progress ${config.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Deadlines by Status</h3>
          <div className="space-y-3">
            {stats.deadlinesByStatus
              .sort((a, b) => b.count - a.count)
              .map((s) => {
                const config = STATUS_LABELS[s.status] || { label: s.status, color: "bg-slate-400" };
                const pct = (s.count / maxStatusCount) * 100;
                return (
                  <div key={s.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700">{config.label}</span>
                      <span className="text-sm font-semibold text-slate-900">{s.count}</span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full animate-progress ${config.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
