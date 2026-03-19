"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import StatusBadge from "@/components/StatusBadge";
import { getCategoryLabel } from "@/lib/categories";
import { getDaysUntil, getUrgencyLabel } from "@/lib/deadline-status";
import {
  Calendar,
  User,
  FileText,
  Upload,
  CheckCircle,
  Archive,
  Edit3,
  Copy,
  Clock,
  Bell,
  MessageSquare,
  Plus,
  X,
  Download,
  Users,
} from "lucide-react";

// Matches Prisma User select shape from API
interface OwnerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Matches Prisma Document shape
interface DocumentData {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
}

// Matches Prisma ActivityLog with included user
interface ActivityData {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// Matches Prisma DeadlineWatcher with included user
interface WatcherData {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Matches Prisma Reminder shape
interface ReminderData {
  id: string;
  type: string;
  daysBefore: number;
  sentAt: string | null;
}

// Matches the full deadline GET response from /api/deadlines/[id]
interface DeadlineData {
  id: string;
  title: string;
  category: string;
  status: string;
  expirationDate: string;
  issueDate: string | null;
  notes: string | null;
  isRecurring: boolean;
  recurringMonths: number | null;
  completedAt: string | null;
  completionNote: string | null;
  ownerId: string;
  owner: OwnerData;
  handledById: string | null;
  companyId: string;
  locationId: string | null;
  documents: DocumentData[];
  activityLogs: ActivityData[];
  watchers: WatcherData[];
  reminders: ReminderData[];
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

function ownerName(owner: OwnerData | null | undefined): string {
  if (!owner) return "Unassigned";
  return `${owner.firstName} ${owner.lastName}`;
}

function initials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

function reminderLabel(daysBefore: number): string {
  if (daysBefore === 0) return "Overdue";
  if (daysBefore === 1) return "1 day before";
  return `${daysBefore} days before`;
}

function CompletionModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Mark as Complete
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Add an optional note about the completion.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Completion note..."
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none mb-4"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Confirm Complete
          </button>
        </div>
      </div>
    </div>
  );
}

function AddWatcherModal({
  teamMembers,
  existingWatcherIds,
  onAdd,
  onCancel,
}: {
  teamMembers: TeamMember[];
  existingWatcherIds: string[];
  onAdd: (userId: string) => void;
  onCancel: () => void;
}) {
  const available = teamMembers.filter(
    (m) => !existingWatcherIds.includes(m.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Add Watcher</h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {available.length > 0 ? (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {available.map((member) => (
              <button
                key={member.id}
                onClick={() => onAdd(member.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                  {initials(member.firstName, member.lastName)}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{member.email}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">
            All team members are already watching this deadline.
          </p>
        )}
      </div>
    </div>
  );
}

export default function DeadlineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deadline, setDeadline] = useState<DeadlineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showWatcherModal, setShowWatcherModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  async function fetchDeadline() {
    try {
      const res = await fetch(`/api/deadlines/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDeadline(data);
      }
    } catch (err) {
      console.error("Failed to fetch deadline:", err);
    }
  }

  useEffect(() => {
    async function load() {
      await fetchDeadline();
      // Also load team members for watcher modal
      try {
        const res = await fetch("/api/team");
        if (res.ok) {
          const data = await res.json();
          setTeamMembers(
            data.map((m: { id: string; firstName: string; lastName: string; email: string }) => ({
              id: m.id,
              firstName: m.firstName,
              lastName: m.lastName,
              email: m.email,
            }))
          );
        }
      } catch {
        // non-critical
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleComplete(note: string) {
    try {
      const res = await fetch(`/api/deadlines/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completionNote: note || null }),
      });
      if (res.ok) {
        // Response is { completed, renewed } — refetch full detail instead
        await fetchDeadline();
      }
    } catch (err) {
      console.error("Failed to complete deadline:", err);
    }
    setShowCompleteModal(false);
  }

  async function handleArchive() {
    if (!confirm("Are you sure you want to archive this deadline?")) return;
    try {
      const res = await fetch(`/api/deadlines/${id}/archive`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchDeadline();
      }
    } catch (err) {
      console.error("Failed to archive deadline:", err);
    }
  }

  async function handleDuplicate() {
    if (!deadline) return;
    try {
      const res = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${deadline.title} (Copy)`,
          category: deadline.category,
          expirationDate: deadline.expirationDate,
          issueDate: deadline.issueDate,
          notes: deadline.notes,
          isRecurring: deadline.isRecurring,
          recurringMonths: deadline.recurringMonths,
          ownerId: deadline.ownerId,
          locationId: deadline.locationId,
        }),
      });
      if (res.ok) {
        const newDeadline = await res.json();
        router.push(`/deadlines/${newDeadline.id}`);
      }
    } catch (err) {
      console.error("Failed to duplicate deadline:", err);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("deadlineId", id);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchDeadline();
      }
    } catch (err) {
      console.error("Failed to upload document:", err);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAddWatcher(userId: string) {
    try {
      const res = await fetch(`/api/deadlines/${id}/watchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        await fetchDeadline();
      }
    } catch (err) {
      console.error("Failed to add watcher:", err);
    }
    setShowWatcherModal(false);
  }

  async function handleRemoveWatcher(userId: string) {
    if (!confirm("Remove this watcher?")) return;
    try {
      const res = await fetch(`/api/deadlines/${id}/watchers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        await fetchDeadline();
      }
    } catch (err) {
      console.error("Failed to remove watcher:", err);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-48" />
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-32" />
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-40" />
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!deadline) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Deadline not found
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          The deadline you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/deadlines"
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          Back to Deadlines
        </Link>
      </div>
    );
  }

  const days = getDaysUntil(new Date(deadline.expirationDate));
  const urgency = getUrgencyLabel(days);
  const isTerminal = deadline.status === "completed" || deadline.status === "archived";

  const reminders: ReminderData[] = deadline.reminders || [];
  const displayReminders =
    reminders.length > 0
      ? reminders
      : [30, 14, 7, 3, 1, 0].map((d, i) => ({
          id: `default-${i}`,
          type: "email",
          daysBefore: d,
          sentAt: null,
        }));

  return (
    <div className="space-y-6">
      {showCompleteModal && (
        <CompletionModal
          onConfirm={handleComplete}
          onCancel={() => setShowCompleteModal(false)}
        />
      )}

      {showWatcherModal && (
        <AddWatcherModal
          teamMembers={teamMembers}
          existingWatcherIds={[
            deadline.ownerId,
            ...deadline.watchers.map((w) => w.user.id),
          ]}
          onAdd={handleAddWatcher}
          onCancel={() => setShowWatcherModal(false)}
        />
      )}

      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/deadlines"
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            &larr;
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {deadline.title}
          </h1>
          <StatusBadge status={deadline.status} />
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {getCategoryLabel(deadline.category)}
          </span>
        </div>
        {!isTerminal && (
          <div className="flex items-center gap-2">
            <Link
              href={`/deadlines/${id}/edit`}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </Link>
            <button
              onClick={handleArchive}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              <Archive className="w-4 h-4" />
              Archive
            </button>
            <button
              onClick={() => setShowCompleteModal(true)}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Complete
            </button>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Expiration Date</p>
                  <p className="text-sm font-medium text-slate-900">
                    {format(new Date(deadline.expirationDate), "MMMM d, yyyy")}
                  </p>
                  <p
                    className={`text-xs font-medium ${days < 0 ? "text-red-600" : days <= 7 ? "text-amber-600" : "text-slate-500"}`}
                  >
                    {urgency}
                  </p>
                </div>
              </div>

              {deadline.issueDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Issue Date</p>
                    <p className="text-sm font-medium text-slate-900">
                      {format(new Date(deadline.issueDate), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Owner</p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                      {initials(
                        deadline.owner?.firstName || "",
                        deadline.owner?.lastName || ""
                      )}
                    </span>
                    <p className="text-sm font-medium text-slate-900">
                      {ownerName(deadline.owner)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <StatusBadge status={deadline.status} />
                </div>
              </div>

              {deadline.isRecurring && (
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Recurring</p>
                    <p className="text-sm font-medium text-slate-900">
                      Every {deadline.recurringMonths} month
                      {deadline.recurringMonths !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )}

              {deadline.completedAt && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Completed</p>
                    <p className="text-sm font-medium text-slate-900">
                      {format(new Date(deadline.completedAt), "MMMM d, yyyy")}
                    </p>
                    {deadline.completionNote && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {deadline.completionNote}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documents Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Documents
              </h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={handleUpload}
              />
            </div>
            {deadline.documents && deadline.documents.length > 0 ? (
              <div className="space-y-2">
                {deadline.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {doc.originalName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(doc.createdAt), "MMM d, yyyy")} &middot;{" "}
                          {(doc.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <a
                      href={`/api/documents/${doc.id}`}
                      download={doc.originalName}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                No documents attached yet.
              </p>
            )}
          </div>

          {/* Activity Log Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Activity Log
            </h2>
            {deadline.activityLogs && deadline.activityLogs.length > 0 ? (
              <div className="space-y-3">
                {deadline.activityLogs.map((activity) => {
                  const userName = `${activity.user.firstName} ${activity.user.lastName}`;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 py-2"
                    >
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex-shrink-0 mt-0.5">
                        {initials(
                          activity.user.firstName,
                          activity.user.lastName
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900">
                          <span className="font-medium">{userName}</span>{" "}
                          <span className="text-slate-500">
                            {activity.action.replace(/_/g, " ")}
                          </span>
                        </p>
                        {activity.details && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {activity.details}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-0.5">
                          {format(
                            new Date(activity.createdAt),
                            "MMM d, yyyy 'at' h:mm a"
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                No activity recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Actions Card */}
          {!isTerminal && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-3">
                Actions
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="w-full flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </button>
                <button
                  onClick={handleArchive}
                  className="w-full flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
                <Link
                  href={`/deadlines/${id}/edit`}
                  className="w-full flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </Link>
                <button
                  onClick={handleDuplicate}
                  className="w-full flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
              </div>
            </div>
          )}

          {/* Watchers Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <h2 className="text-base font-semibold text-slate-900">
                  Watchers
                </h2>
              </div>
              <button
                onClick={() => setShowWatcherModal(true)}
                className="text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {deadline.watchers && deadline.watchers.length > 0 ? (
              <div className="space-y-2">
                {deadline.watchers.map((watcher) => {
                  const wName = `${watcher.user.firstName} ${watcher.user.lastName}`;
                  return (
                    <div
                      key={watcher.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                          {initials(
                            watcher.user.firstName,
                            watcher.user.lastName
                          )}
                        </span>
                        <span className="text-sm text-slate-700">{wName}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveWatcher(watcher.user.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No watchers added.</p>
            )}
          </div>

          {/* Reminders Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-900">
                Reminders
              </h2>
            </div>
            <div className="space-y-2">
              {displayReminders
                .sort((a, b) => b.daysBefore - a.daysBefore)
                .map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-slate-700">
                      {reminderLabel(reminder.daysBefore)}
                    </span>
                    {reminder.sentAt ? (
                      <span className="text-xs text-emerald-600 font-medium">
                        Sent
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Pending</span>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-900">Notes</h2>
            </div>
            {deadline.notes ? (
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {deadline.notes}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">No notes added.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
