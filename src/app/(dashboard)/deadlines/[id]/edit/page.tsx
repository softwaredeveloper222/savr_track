"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
}

export default function EditDeadlinePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showIssueDate, setShowIssueDate] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "",
    expirationDate: "",
    issueDate: "",
    ownerId: "",
    isRecurring: false,
    recurringMonths: 12,
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const [deadlineRes, teamRes] = await Promise.all([
          fetch(`/api/deadlines/${id}`),
          fetch("/api/team"),
        ]);

        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeamMembers(teamData);
        }

        if (deadlineRes.ok) {
          const data = await deadlineRes.json();
          setForm({
            title: data.title || "",
            category: data.category || "",
            expirationDate: data.expirationDate
              ? data.expirationDate.split("T")[0]
              : "",
            issueDate: data.issueDate ? data.issueDate.split("T")[0] : "",
            ownerId: data.ownerId || "",
            isRecurring: data.isRecurring || false,
            recurringMonths: data.recurringMonths || 12,
            notes: data.notes || "",
          });
          if (data.issueDate) {
            setShowIssueDate(true);
          }
        }
      } catch (err) {
        console.error("Failed to load deadline data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.category) errs.category = "Category is required";
    if (!form.expirationDate)
      errs.expirationDate = "Expiration date is required";
    if (!form.ownerId) errs.ownerId = "Owner is required";
    if (form.isRecurring && (!form.recurringMonths || form.recurringMonths < 1))
      errs.recurringMonths = "Recurrence interval must be at least 1 month";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/deadlines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          expirationDate: form.expirationDate,
          issueDate: showIssueDate && form.issueDate ? form.issueDate : null,
          ownerId: form.ownerId,
          isRecurring: form.isRecurring,
          recurringMonths: form.isRecurring ? form.recurringMonths : null,
          notes: form.notes || null,
        }),
      });

      if (res.ok) {
        router.push(`/deadlines/${id}`);
      }
    } catch (err) {
      console.error("Failed to update deadline:", err);
    } finally {
      setSubmitting(false);
    }
  }

  function updateField(field: string, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6" />
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
                <div className="h-10 w-full bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Edit Deadline</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${
                  errors.category ? "border-red-400" : "border-slate-300"
                }`}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. General Liability Insurance Renewal"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${
                  errors.title ? "border-red-400" : "border-slate-300"
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Expiration Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Expiration Date
              </label>
              <input
                type="date"
                value={form.expirationDate}
                onChange={(e) => updateField("expirationDate", e.target.value)}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${
                  errors.expirationDate ? "border-red-400" : "border-slate-300"
                }`}
              />
              {errors.expirationDate && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.expirationDate}
                </p>
              )}
            </div>

            {/* Issue Date (collapsible) */}
            <div>
              <button
                type="button"
                onClick={() => setShowIssueDate(!showIssueDate)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                {showIssueDate ? "- Remove issue date" : "+ Add issue date"}
              </button>
              {showIssueDate && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => updateField("issueDate", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Owner */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Owner
              </label>
              <select
                value={form.ownerId}
                onChange={(e) => updateField("ownerId", e.target.value)}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${
                  errors.ownerId ? "border-red-400" : "border-slate-300"
                }`}
              >
                <option value="">Select an owner</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
              {errors.ownerId && (
                <p className="mt-1 text-xs text-red-600">{errors.ownerId}</p>
              )}
            </div>

            {/* Recurring */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Recurring
              </label>
              <button
                type="button"
                onClick={() => updateField("isRecurring", !form.isRecurring)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.isRecurring ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.isRecurring ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {form.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Recurrence interval (months)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.recurringMonths}
                  onChange={(e) =>
                    updateField(
                      "recurringMonths",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${
                    errors.recurringMonths ? "border-red-400" : "border-slate-300"
                  }`}
                />
                {errors.recurringMonths && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.recurringMonths}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Notes{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                placeholder="Any additional notes..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Link
              href={`/deadlines/${id}`}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
