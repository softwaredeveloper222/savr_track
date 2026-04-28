"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import StatusBadge from "@/components/StatusBadge";
import { getCategoryLabel } from "@/lib/categories";
import Select from "@/components/Select";
import DatePicker from "@/components/DatePicker";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronRight,
  Eye,
  X,
  Sparkles,
} from "lucide-react";

interface ReviewItem {
  id: string;
  title: string;
  category: string;
  status: string;
  verificationStatus: string;
  scanConfidence: string | null;
  scanData: string | null;
  expirationDate: string;
  reviewNote: string | null;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  documents: {
    id: string;
    originalName: string;
    extractedTitle: string | null;
    extractedCategory: string | null;
    extractedExpDate: string | null;
    scanConfidence: string | null;
  }[];
}

interface ReviewData {
  items: ReviewItem[];
  counts: {
    uploaded: number;
    scanned: number;
    needs_review: number;
    total: number;
  };
}

function VerifyModal({
  item,
  onClose,
  onVerify,
}: {
  item: ReviewItem;
  onClose: () => void;
  onVerify: (action: string, data: Record<string, unknown>) => void;
}) {
  const scanData = item.scanData ? JSON.parse(item.scanData) : null;
  const doc = item.documents[0];

  const [title, setTitle] = useState(scanData?.title || doc?.extractedTitle || item.title);
  const [category, setCategory] = useState(scanData?.category || doc?.extractedCategory || item.category);
  const [expDate, setExpDate] = useState(scanData?.expDate || doc?.extractedExpDate || item.expirationDate.split("T")[0]);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: "business_license", label: "Business License" },
    { value: "trade_license", label: "Trade License" },
    { value: "insurance", label: "Insurance Policy" },
    { value: "certification", label: "Certification" },
    { value: "inspection", label: "Inspection" },
    { value: "permit", label: "Permit" },
    { value: "filing", label: "Annual Filing" },
    { value: "tax", label: "Tax Reminder" },
    { value: "safety_training", label: "Safety / Training" },
    { value: "coi", label: "Certificate of Insurance" },
    { value: "operational", label: "Operational Deadline" },
    { value: "custom", label: "Custom" },
  ];

  async function handleAction(action: string) {
    setSubmitting(true);
    await onVerify(action, {
      reviewNote,
      correctedData: { title, category, expirationDate: expDate },
    });
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg mx-4 animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-slate-900">Review & Verify</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Scan confidence indicator */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <span className="text-sm text-slate-600">Scan Confidence:</span>
            <span className={`text-sm font-semibold ${
              item.scanConfidence === "high" ? "text-emerald-600" :
              item.scanConfidence === "medium" ? "text-amber-600" : "text-red-600"
            }`}>
              {item.scanConfidence?.toUpperCase() || "N/A"}
            </span>
          </div>

          {/* Document info */}
          {doc && (
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700">{doc.originalName}</p>
                <p className="text-xs text-slate-500">Scanned document</p>
              </div>
            </div>
          )}

          {/* Editable fields — pre-filled with scan results */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <Select
              value={category}
              onChange={setCategory}
              options={categories}
              placeholder="Select category"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Expiration Date</label>
            <DatePicker value={expDate} onChange={setExpDate} placeholder="Select date" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Review Note (optional)</label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={2}
              placeholder="Add a note about this verification..."
              className="input-base resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => handleAction("reject")}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Reject
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction("flag")}
              disabled={submitting}
              className="btn-secondary text-sm px-4 py-2"
            >
              Flag for Re-review
            </button>
            <button
              onClick={() => handleAction("verify")}
              disabled={submitting}
              className="btn-primary text-sm px-4 py-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Verifying..." : "Verify & Activate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);

  async function fetchReview() {
    try {
      const res = await fetch("/api/review");
      if (res.status === 403) {
        setError("Only admins can access the review queue.");
        return;
      }
      if (!res.ok) throw new Error("Failed to load review queue");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReview();
  }, []);

  async function handleVerify(action: string, body: Record<string, unknown>) {
    if (!selectedItem) return;
    try {
      const res = await fetch(`/api/deadlines/${selectedItem.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      if (res.ok) {
        setSelectedItem(null);
        await fetchReview();
      }
    } catch (err) {
      console.error("Verification failed:", err);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 shimmer rounded-lg w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
              <div className="h-4 shimmer rounded w-20 mb-3" />
              <div className="h-8 shimmer rounded w-12" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 shimmer rounded-xl mb-2" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center animate-fade-in">
        <ShieldAlert className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-800 font-medium">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {selectedItem && (
        <VerifyModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onVerify={handleVerify}
        />
      )}

      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900">Review Queue</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Verify scanned data before reminders activate
        </p>
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in card-hover" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Needs Review</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4 text-orange-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.counts.needs_review}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in card-hover" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider">Scanned</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-cyan-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.counts.scanned}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 animate-fade-in card-hover" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Uploaded</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <FileText className="h-4 w-4 text-slate-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.counts.uploaded}</p>
        </div>
      </div>

      {/* Review items */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 animate-fade-in" style={{ animationDelay: "200ms" }}>
        {data.items.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">All caught up!</h3>
            <p className="text-sm text-slate-500">No items need review right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.items.map((item, i) => {
              const doc = item.documents[0];
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${250 + i * 50}ms` }}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <StatusBadge status={item.verificationStatus} size="sm" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/deadlines/${item.id}`}
                        className="text-sm font-medium text-slate-900 hover:text-teal-700 transition-colors truncate block"
                      >
                        {item.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{getCategoryLabel(item.category)}</span>
                        <span className="text-xs text-slate-300">&middot;</span>
                        <span className="text-xs text-slate-500">
                          {item.owner.firstName} {item.owner.lastName}
                        </span>
                        {doc && (
                          <>
                            <span className="text-xs text-slate-300">&middot;</span>
                            <span className="text-xs text-slate-400">{doc.originalName}</span>
                          </>
                        )}
                      </div>
                      {item.reviewNote && (
                        <p className="text-xs text-orange-600 mt-0.5">{item.reviewNote}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {item.scanConfidence && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                        item.scanConfidence === "high"
                          ? "bg-emerald-50 text-emerald-600"
                          : item.scanConfidence === "medium"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-red-50 text-red-600"
                      }`}>
                        {item.scanConfidence}
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="inline-flex items-center gap-1.5 btn-primary text-xs px-3 py-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
