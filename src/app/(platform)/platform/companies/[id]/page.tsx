"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Users,
  CalendarClock,
  FileText,
  Pause,
  Play,
  Trash2,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";

interface CompanyUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string | null;
  createdAt: string;
}

interface CompanyDetail {
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
  users: CompanyUser[];
  _count: { users: number; deadlines: number; locations: number };
  documentCount: number;
  statusBreakdown: { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500",
  due_soon: "bg-amber-500",
  overdue: "bg-red-500",
  completed: "bg-blue-500",
  archived: "bg-slate-400",
};

function getRoleBadge(role: string) {
  switch (role) {
    case "superadmin":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "admin":
      return "bg-teal-100 text-teal-700 border-teal-200";
    case "viewer":
      return "bg-purple-100 text-purple-700 border-purple-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", businessType: "" });
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionInFlight, setActionInFlight] = useState<"suspend" | "delete" | null>(null);
  const [progress, setProgress] = useState(0);

  async function fetchCompany() {
    try {
      const res = await fetch(`/api/platform/companies/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load company");
      }
      const json = await res.json();
      setCompany(json);
      setForm({
        name: json.name,
        phone: json.phone || "",
        address: json.address || "",
        businessType: json.businessType || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCompany();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/platform/companies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      showToast("success", "Company updated");
      setEditing(false);
      await fetchCompany();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSuspend(suspended: boolean) {
    setActionInFlight("suspend");
    setProgress(20);
    const interval = setInterval(() => {
      setProgress((p) => (p < 85 ? p + 5 : p));
    }, 150);

    try {
      const res = await fetch(`/api/platform/companies/${id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended, reason: suspendReason }),
      });
      const json = await res.json();
      clearInterval(interval);
      setProgress(100);
      if (!res.ok) throw new Error(json.error || "Action failed");
      showToast("success", suspended ? "Company suspended" : "Company reactivated");
      setShowSuspendModal(false);
      setSuspendReason("");
      await fetchCompany();
    } catch (err) {
      clearInterval(interval);
      showToast("error", err instanceof Error ? err.message : "Action failed");
    } finally {
      setTimeout(() => {
        setActionInFlight(null);
        setProgress(0);
      }, 300);
    }
  }

  async function handleDelete() {
    if (!company) return;
    const confirmText = `delete ${company.name}`;
    const userInput = prompt(
      `This will permanently delete "${company.name}", all ${company._count.users} users, all ${company._count.deadlines} deadlines, and all uploaded documents.\n\nType "${confirmText}" to confirm:`
    );
    if (userInput !== confirmText) {
      if (userInput !== null) showToast("error", "Confirmation text did not match. Deletion cancelled.");
      return;
    }

    setActionInFlight("delete");
    setProgress(10);
    const interval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.max(1, (90 - p) * 0.06) : p));
    }, 200);

    try {
      const res = await fetch(`/api/platform/companies/${id}`, { method: "DELETE" });
      const json = await res.json();
      clearInterval(interval);
      setProgress(100);
      if (!res.ok) throw new Error(json.error || "Delete failed");
      showToast("success", `${company.name} deleted`);
      setTimeout(() => router.push("/platform/companies"), 600);
    } catch (err) {
      clearInterval(interval);
      showToast("error", err instanceof Error ? err.message : "Delete failed");
      setActionInFlight(null);
      setProgress(0);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 shimmer rounded-lg w-48" />
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 h-40">
          <div className="h-5 shimmer rounded w-32 mb-3" />
          <div className="h-4 shimmer rounded w-48" />
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center animate-fade-in">
        <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-800 font-medium">{error || "Company not found"}</p>
        <Link href="/platform/companies" className="text-amber-700 hover:text-amber-800 text-sm font-medium mt-3 inline-block">
          ← Back to Companies
        </Link>
      </div>
    );
  }

  const maxStatusCount = Math.max(...company.statusBreakdown.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Top progress bar */}
      {actionInFlight && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ease-out ${
              actionInFlight === "delete"
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : "bg-gradient-to-r from-amber-500 to-amber-600"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 animate-slide-down ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          } border rounded-xl px-4 py-3 shadow-lg flex items-center gap-2`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Suspend modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 w-full max-w-sm mx-4 animate-scale-in overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pause className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-slate-900">Suspend Company</h3>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {company.name} users will be unable to log in. Data is preserved.
              </p>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Reason <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                placeholder="e.g. Payment overdue"
                className="input-base resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason("");
                }}
                className="btn-secondary text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuspend(true)}
                disabled={actionInFlight === "suspend"}
                className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
              >
                {actionInFlight === "suspend" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 animate-fade-in">
        <div className="min-w-0">
          <Link
            href="/platform/companies"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            All Companies
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
            {company.suspended ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                <Pause className="w-3 h-3" />
                Suspended
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            )}
            {!company.onboardingCompleted && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3" />
                Onboarding
              </span>
            )}
          </div>
          {company.businessType && (
            <p className="text-sm text-slate-500 mt-1 capitalize">
              {company.businessType.replace(/_/g, " ")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {company.suspended ? (
            <button
              onClick={() => handleSuspend(false)}
              disabled={actionInFlight !== null}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
            >
              {actionInFlight === "suspend" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Reactivate
            </button>
          ) : (
            <button
              onClick={() => setShowSuspendModal(true)}
              disabled={actionInFlight !== null}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
            >
              <Pause className="w-4 h-4" />
              Suspend
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={actionInFlight !== null}
            className="inline-flex items-center gap-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
          >
            {actionInFlight === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </div>

      {/* Suspension banner */}
      {company.suspended && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              This company is currently suspended
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              All users in this company are blocked from logging in.
              {company.suspendedAt && (
                <> Suspended on {format(new Date(company.suspendedAt), "MMM d, yyyy")}.</>
              )}
            </p>
            {company.suspendedReason && (
              <p className="text-xs text-red-700 mt-1 italic">Reason: {company.suspendedReason}</p>
            )}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Users</span>
            <Users className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{company._count.users}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadlines</span>
            <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{company._count.deadlines}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Documents</span>
            <FileText className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{company.documentCount}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</span>
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mt-1">
            {format(new Date(company.createdAt), "MMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Two-column: details + status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Company details (editable) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Company Details</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-800 text-sm font-medium transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      name: company.name,
                      phone: company.phone || "",
                      address: company.address || "",
                      businessType: company.businessType || "",
                    });
                  }}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm font-medium"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Name</label>
              {editing ? (
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-base"
                />
              ) : (
                <p className="text-sm text-slate-900">{company.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Business Type</label>
              {editing ? (
                <input
                  type="text"
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                  placeholder="e.g. hvac, electrical"
                  className="input-base"
                />
              ) : (
                <p className="text-sm text-slate-700 capitalize">
                  {company.businessType ? company.businessType.replace(/_/g, " ") : "Not set"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Phone</label>
              {editing ? (
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-base"
                />
              ) : (
                <p className="text-sm text-slate-700 flex items-center gap-1.5">
                  {company.phone ? (
                    <>
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {company.phone}
                    </>
                  ) : (
                    <span className="text-slate-400">Not set</span>
                  )}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Address</label>
              {editing ? (
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="input-base resize-none"
                />
              ) : (
                <p className="text-sm text-slate-700 flex items-start gap-1.5">
                  {company.address ? (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{company.address}</span>
                    </>
                  ) : (
                    <span className="text-slate-400">Not set</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Deadlines by Status</h2>
          {company.statusBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500">No deadlines yet.</p>
          ) : (
            <div className="space-y-3">
              {company.statusBreakdown
                .sort((a, b) => b.count - a.count)
                .map((s) => {
                  const color = STATUS_COLORS[s.status] || "bg-slate-400";
                  const pct = (s.count / maxStatusCount) * 100;
                  return (
                    <div key={s.status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-700 capitalize">{s.status.replace(/_/g, " ")}</span>
                        <span className="text-sm font-semibold text-slate-900">{s.count}</span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-2 rounded-full animate-progress ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Users in this company */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Users in this Company
          </h2>
          <Link
            href={`/platform/users?companyId=${company.id}`}
            className="text-amber-700 hover:text-amber-800 text-sm font-medium transition-colors"
          >
            Manage in user list →
          </Link>
        </div>
        {company.users.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No users in this company.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {company.users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {getInitials(u.firstName, u.lastName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${getRoleBadge(u.role)}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
