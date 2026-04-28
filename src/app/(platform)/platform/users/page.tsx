"use client";

import { useEffect, useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import Select from "@/components/Select";
import {
  Users,
  Search,
  X,
  Edit3,
  KeyRound,
  Trash2,
  Mail,
  Phone,
  Building2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Loader2,
} from "lucide-react";

interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
  createdAt: string;
  company: { id: string; name: string; businessType: string | null };
  _count: { ownedDeadlines: number };
  stats: { accessCount: number; lastActiveAt: string | null };
}

const ROLE_OPTIONS = [
  { value: "superadmin", label: "Super Admin", description: "Platform-wide access" },
  { value: "admin", label: "Admin", description: "Company admin" },
  { value: "member", label: "Member", description: "Standard user" },
  { value: "viewer", label: "Viewer (Guest)", description: "Read-only access" },
];

const ROLE_FILTER = [{ value: "", label: "All roles" }, ...ROLE_OPTIONS];

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

function getRoleBadge(role: string) {
  switch (role) {
    case "superadmin":
      return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: Crown };
    case "admin":
      return { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", icon: null };
    case "viewer":
      return { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", icon: null };
    default:
      return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", icon: null };
  }
}

function ResetPasswordModal({
  user,
  onClose,
  onSubmit,
}: {
  user: PlatformUser;
  onClose: () => void;
  onSubmit: (pw: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 w-full max-w-sm mx-4 animate-scale-in overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-slate-900">Reset Password</h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            For {user.firstName} {user.lastName} ({user.company.name})
          </p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="input-base"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm px-4 py-2">
              {submitting ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [resetUser, setResetUser] = useState<PlatformUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleteProgress, setDeleteProgress] = useState(0);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/platform/users");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load users");
      }
      const json = await res.json();
      setUsers(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setCurrentUserId((d.user ?? d).id))
      .catch(() => {});
  }, []);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        return (
          fullName.includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.company.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, search, roleFilter]);

  async function handleRoleChange(user: PlatformUser, newRole: string) {
    if (newRole === user.role) return;
    try {
      const res = await fetch(`/api/platform/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Role change failed");
      showToast("success", `${user.firstName} is now ${newRole}`);
      await fetchUsers();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Role change failed");
    }
  }

  async function handleDelete(user: PlatformUser) {
    if (!confirm(`Delete ${user.firstName} ${user.lastName}? Their deadlines will be reassigned.`)) return;

    setDeletingUserId(user.id);
    setDeleteProgress(8);

    // Animate progress while the request is in flight. The API performs many
    // sequential DB operations (reassign deadlines, delete watchers, reminders,
    // activity logs, access logs, notification prefs, then user) so this can
    // take a moment.
    const progressInterval = setInterval(() => {
      setDeleteProgress((p) => (p < 90 ? p + Math.max(1, (90 - p) * 0.08) : p));
    }, 200);

    try {
      const res = await fetch(`/api/platform/users/${user.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");

      clearInterval(progressInterval);
      setDeleteProgress(100);
      showToast("success", `${user.firstName} ${user.lastName} deleted`);
      await fetchUsers();
    } catch (err) {
      clearInterval(progressInterval);
      showToast("error", err instanceof Error ? err.message : "Delete failed");
    } finally {
      // Brief pause so the user sees the bar reach 100% before it disappears
      setTimeout(() => {
        setDeletingUserId(null);
        setDeleteProgress(0);
      }, 300);
    }
  }

  async function handleResetPassword(newPassword: string) {
    if (!resetUser) return;
    const res = await fetch(`/api/platform/users/${resetUser.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Reset failed");
    setResetUser(null);
    showToast("success", `Password reset for ${resetUser.firstName}`);
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center animate-fade-in">
        <p className="text-red-800 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top progress bar — visible while a delete is in flight */}
      {deletingUserId && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-200 ease-out"
            style={{ width: `${deleteProgress}%` }}
          />
        </div>
      )}

      {resetUser && (
        <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} onSubmit={handleResetPassword} />
      )}

      {toast && (
        <div className={`fixed top-6 right-6 z-50 animate-slide-down ${
          toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        } border rounded-xl px-4 py-3 shadow-lg flex items-center gap-2`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Every user signed up across all companies on Surevia
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-700 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
          <Crown className="w-3.5 h-3.5" />
          Cross-Company Access
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 animate-fade-in" style={{ animationDelay: "50ms" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or company..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
            />
          </div>
          <div className="sm:w-48">
            <Select value={roleFilter} onChange={setRoleFilter} options={ROLE_FILTER} />
          </div>
        </div>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 shimmer rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-12 text-center">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 mb-1">No users found</h3>
          <p className="text-sm text-slate-500">
            {search || roleFilter ? "Try clearing your filters." : "No users registered yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Activity</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u, i) => {
                  const badge = getRoleBadge(u.role);
                  const RoleIcon = badge.icon;
                  const isMe = u.id === currentUserId;
                  const isDeleting = deletingUserId === u.id;
                  const isAnyDeleting = deletingUserId !== null;
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/50 transition-all animate-fade-in ${
                        isDeleting ? "bg-red-50/40 opacity-70" : isAnyDeleting ? "opacity-60" : ""
                      }`}
                      style={{ animationDelay: `${150 + i * 20}ms` }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${u.role === "superadmin" ? "bg-gradient-to-br from-amber-500 to-amber-700" : "bg-gradient-to-br from-teal-500 to-teal-700"} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                            {getInitials(u.firstName, u.lastName)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {u.firstName} {u.lastName}
                              </p>
                              {isMe && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">YOU</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <p className="text-xs text-slate-500 truncate">{u.email}</p>
                            </div>
                            {u.phone && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <p className="text-xs text-slate-500">{u.phone}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm text-slate-700 truncate max-w-[140px]" title={u.company.name}>
                            {u.company.name}
                          </span>
                        </div>
                        {u.company.businessType && (
                          <span className="text-[10px] text-slate-400 capitalize ml-5">
                            {u.company.businessType.replace(/_/g, " ")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          disabled={isMe || isAnyDeleting}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${badge.bg} ${badge.text} ${badge.border} ${isMe || isAnyDeleting ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <option value="superadmin">Super Admin</option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        {RoleIcon && <RoleIcon className="w-3 h-3 text-amber-500 inline-block ml-1" />}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Activity className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold">{u.stats.accessCount}</span>
                          <span className="text-slate-400">in 30d</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {u.stats.lastActiveAt
                            ? `Last: ${formatDistanceToNow(new Date(u.stats.lastActiveAt), { addSuffix: true })}`
                            : "Never active"}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-slate-500">
                          {format(new Date(u.createdAt), "MMM d, yyyy")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {isDeleting ? (
                            <div className="flex items-center gap-2 text-xs text-red-600 font-medium px-2 py-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Deleting...
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setResetUser(u)}
                                disabled={isAnyDeleting}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Reset password"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(u)}
                                disabled={isMe || isAnyDeleting}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title={isMe ? "Cannot delete yourself" : "Delete user"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of <span className="font-semibold text-slate-700">{users.length}</span> users
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
