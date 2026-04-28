"use client";

import { useEffect, useState } from "react";
import { Plus, Edit3, Trash2, X, Phone, Mail } from "lucide-react";
import Select from "@/components/Select";

const AVATAR_COLORS = [
  "bg-teal-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-purple-500",
  "bg-cyan-500",
];

function nameHash(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[nameHash(name) % AVATAR_COLORS.length];
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
}

function getRoleBadgeClasses(role: string): string {
  switch (role) {
    case "admin":
      return "bg-teal-100 text-teal-700";
    case "viewer":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
  createdAt: string;
  _count: {
    ownedDeadlines: number;
  };
}

interface MemberFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  phone: string;
}

const emptyForm: MemberFormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "member",
  phone: "",
};

function MemberFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit,
  saving,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => void;
  initialData: MemberFormData;
  isEdit: boolean;
  saving: boolean;
}) {
  const [form, setForm] = useState<MemberFormData>(initialData);

  useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit Member" : "Add Member"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              disabled={isEdit}
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role
            </label>
            <Select
              value={form.role}
              onChange={(v) => setForm((f) => ({ ...f, role: v }))}
              options={[
                { value: "admin", label: "Admin", description: "Full access to all features" },
                { value: "member", label: "Member", description: "Create and manage deadlines" },
                { value: "viewer", label: "Viewer (Guest)", description: "Read-only access — cannot create or edit" },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Optional"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : isEdit
                ? "Save Changes"
                : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full shimmer" />
        <div className="flex-1">
          <div className="h-4 shimmer rounded w-32 mb-2" />
          <div className="h-3 shimmer rounded w-24" />
        </div>
      </div>
      <div className="h-3 shimmer rounded w-40 mb-2" />
      <div className="h-3 shimmer rounded w-28" />
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchMembers();
  }, []);

  async function fetchCurrentUser() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        const user = data.user ?? data;
        setCurrentUserRole(user.role);
      }
    } catch {
      // ignore
    }
  }

  async function fetchMembers() {
    try {
      setLoading(true);
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error("Failed to fetch team");
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(form: MemberFormData) {
    setSaving(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add member");
      }
      setShowAddModal(false);
      fetchMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditMember(form: MemberFormData) {
    if (!editMember) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/team/${editMember.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          phone: form.phone,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update member");
      }
      setEditMember(null);
      fetchMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update member");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(member: TeamMember) {
    if (
      !confirm(
        `Are you sure you want to remove ${member.firstName} ${member.lastName}? Their deadlines will be reassigned to you.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/team/${member.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove member");
      }
      fetchMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  const isAdmin = currentUserRole === "admin";

  return (
    <div>
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900">Team</h1>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus size={16} />
            Add Member
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Plus size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">
            No team members yet
          </h3>
          <p className="text-sm text-slate-500">
            Add your first team member to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {members.map((member) => {
            const fullName = `${member.firstName} ${member.lastName}`;
            return (
              <div
                key={member.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 card-hover"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(fullName)}`}
                    >
                      {getInitials(member.firstName, member.lastName)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {fullName}
                      </h3>
                      <span
                        className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${getRoleBadgeClasses(member.role)}`}
                      >
                        {member.role}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditMember(member)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500">
                      {member._count.ownedDeadlines} assigned{" "}
                      {member._count.ownedDeadlines === 1
                        ? "deadline"
                        : "deadlines"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      <MemberFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddMember}
        initialData={emptyForm}
        isEdit={false}
        saving={saving}
      />

      {/* Edit Member Modal */}
      <MemberFormModal
        isOpen={editMember !== null}
        onClose={() => setEditMember(null)}
        onSubmit={handleEditMember}
        initialData={
          editMember
            ? {
                firstName: editMember.firstName,
                lastName: editMember.lastName,
                email: editMember.email,
                password: "",
                role: editMember.role,
                phone: editMember.phone || "",
              }
            : emptyForm
        }
        isEdit={true}
        saving={saving}
      />
    </div>
  );
}
