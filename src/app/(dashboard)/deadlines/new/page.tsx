"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { getComplianceItemsForType, type ComplianceItem } from "@/lib/business-types";
import { Sparkles, X, ArrowLeft } from "lucide-react";
import Select from "@/components/Select";
import DatePicker from "@/components/DatePicker";

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
}

export default function NewDeadlinePage() {
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showIssueDate, setShowIssueDate] = useState(false);
  const [suggestions, setSuggestions] = useState<ComplianceItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    // Fetch current user first, then team
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const user = data.user ?? data;
        // Auto-select current user as owner
        if (user.id) {
          setForm((prev) => ({ ...prev, ownerId: user.id }));
        }
        const bt = user.company?.businessType;
        if (bt) {
          const items = getComplianceItemsForType(bt);
          setSuggestions(items);
          if (items.length > 0) setShowSuggestions(true);
        }
      })
      .catch(() => {});

    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => setTeamMembers(data))
      .catch(() => {});
  }, []);

  function applySuggestion(item: ComplianceItem) {
    // Calculate default expiration: recurringMonths from today (or 12 months)
    const months = item.recurringMonths || 12;
    const defaultExp = new Date();
    defaultExp.setMonth(defaultExp.getMonth() + months);
    const expDateStr = defaultExp.toISOString().split("T")[0];

    setForm((prev) => ({
      ...prev,
      title: item.title,
      category: item.category,
      isRecurring: item.isRecurring,
      recurringMonths: months,
      expirationDate: prev.expirationDate || expDateStr,
    }));
    setShowSuggestions(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.title;
      delete next.category;
      delete next.expirationDate;
      return next;
    });
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.category) errs.category = "Category is required";
    if (!form.expirationDate) errs.expirationDate = "Expiration date is required";
    if (!form.ownerId) errs.ownerId = "Owner is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/deadlines", {
        method: "POST",
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
        const data = await res.json();
        router.push(`/deadlines/${data.id}`);
      }
    } catch (err) {
      console.error("Failed to create deadline:", err);
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

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-6 animate-fade-in">
          <Link
            href="/deadlines"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Deadlines
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Add New Deadline</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create a new compliance tracking item</p>
        </div>

        {/* Smart Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mb-6 bg-teal-50 border border-teal-100 rounded-2xl p-5 animate-slide-down">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-teal-900">
                  Suggested for your business type
                </h3>
              </div>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-teal-400 hover:text-teal-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item, i) => (
                <button
                  key={i}
                  onClick={() => applySuggestion(item)}
                  className="inline-flex items-center gap-1 bg-white border border-teal-200 hover:border-teal-400 text-teal-800 rounded-xl px-3 py-1.5 text-xs font-medium transition-all hover:shadow-sm"
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 space-y-5 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <Select
                value={form.category}
                onChange={(v) => updateField("category", v)}
                placeholder="Select a category"
                error={!!errors.category}
                searchable
                options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
              />
              {errors.category && <p className="mt-1.5 text-xs text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. General Liability Insurance Renewal"
                className={`input-base ${errors.title ? "border-red-300 focus:ring-red-500/40 focus:border-red-400" : ""}`}
              />
              {errors.title && <p className="mt-1.5 text-xs text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Expiration Date</label>
              <DatePicker
                value={form.expirationDate}
                onChange={(v) => updateField("expirationDate", v)}
                placeholder="Select expiration date"
                error={!!errors.expirationDate}
              />
              {errors.expirationDate && <p className="mt-1.5 text-xs text-red-600">{errors.expirationDate}</p>}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowIssueDate(!showIssueDate)}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                {showIssueDate ? "- Remove issue date" : "+ Add issue date"}
              </button>
              {showIssueDate && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Date</label>
                  <DatePicker
                    value={form.issueDate}
                    onChange={(v) => updateField("issueDate", v)}
                    placeholder="Select issue date"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Owner</label>
              <Select
                value={form.ownerId}
                onChange={(v) => updateField("ownerId", v)}
                placeholder="Select an owner"
                error={!!errors.ownerId}
                options={teamMembers.map((m) => ({
                  value: m.id,
                  label: `${m.firstName} ${m.lastName}`,
                }))}
              />
              {errors.ownerId && <p className="mt-1.5 text-xs text-red-600">{errors.ownerId}</p>}
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="text-sm font-medium text-slate-700">Recurring</label>
              <button
                type="button"
                onClick={() => updateField("isRecurring", !form.isRecurring)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.isRecurring ? "bg-teal-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
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
                  onChange={(e) => updateField("recurringMonths", parseInt(e.target.value) || 1)}
                  className="input-base"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Notes <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                placeholder="Any additional notes..."
                className="input-base resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <Link href="/deadlines" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Adding..." : "Add Deadline"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
