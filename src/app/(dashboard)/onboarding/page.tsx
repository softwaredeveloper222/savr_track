"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Upload,
  LayoutDashboard,
} from "lucide-react";
import { BUSINESS_TYPES, type ComplianceItem } from "@/lib/business-types";
import { getCategoryLabel } from "@/lib/categories";
import Select from "@/components/Select";
import DatePicker from "@/components/DatePicker";

interface SelectedItem extends ComplianceItem {
  selected: boolean;
  expirationDate: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState("");
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createdCount, setCreatedCount] = useState(0);

  // Fetch company info to get business type
  useEffect(() => {
    async function fetchCompany() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        const user = data.user ?? data;
        const bt = user.company?.businessType;

        if (user.company?.onboardingCompleted) {
          router.replace("/dashboard");
          return;
        }

        if (bt) {
          setBusinessType(bt);
          const type = BUSINESS_TYPES.find((t) => t.value === bt);
          if (type) {
            setItems(
              type.complianceItems.map((item) => ({
                ...item,
                selected: true,
                expirationDate: "",
              }))
            );
          }
        }
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [router]);

  function handleBusinessTypeChange(value: string) {
    setBusinessType(value);
    const type = BUSINESS_TYPES.find((t) => t.value === value);
    if (type) {
      setItems(
        type.complianceItems.map((item) => ({
          ...item,
          selected: true,
          expirationDate: "",
        }))
      );
    } else {
      setItems([]);
    }
  }

  function toggleItem(index: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  }

  function updateItemDate(index: number, date: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, expirationDate: date } : item
      )
    );
  }

  function addCustomItem() {
    if (!customTitle.trim() || !customCategory) return;
    setItems((prev) => [
      ...prev,
      {
        title: customTitle.trim(),
        category: customCategory,
        isRecurring: true,
        recurringMonths: 12,
        description: "Custom compliance item",
        selected: true,
        expirationDate: "",
      },
    ]);
    setCustomTitle("");
    setCustomCategory("");
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const selectedItems = items.filter((item) => item.selected);
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItems.map((item) => ({
            title: item.title,
            category: item.category,
            isRecurring: item.isRecurring,
            recurringMonths: item.recurringMonths,
            expirationDate: item.expirationDate || null,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedCount(data.createdCount || selectedItems.length);
        setStep(4);
      }
    } catch (err) {
      console.error("Onboarding submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skipOnboarding: true }),
      });
    } catch {
      // proceed anyway
    }
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
      </div>
    );
  }

  const selectedCount = items.filter((i) => i.selected).length;
  const totalSteps = step === 4 ? 4 : 3;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      {step < 4 && (
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-slate-900">
            Setup Your Compliance Tracker
          </h1>
          <button
            onClick={handleSkip}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Skip setup
          </button>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step ? "bg-teal-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Step {step} of {totalSteps}
        </p>
      </div>
      )}

      {/* Step 1: Select Business Type */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              What type of contractor are you?
            </h2>
            <p className="text-sm text-slate-500">
              We&apos;ll suggest common compliance items based on your trade.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-children">
            {BUSINESS_TYPES.map((bt) => (
              <button
                key={bt.value}
                onClick={() => handleBusinessTypeChange(bt.value)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                  businessType === bt.value
                    ? "border-teal-600 bg-teal-50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div>
                  <p
                    className={`font-medium ${
                      businessType === bt.value
                        ? "text-teal-900"
                        : "text-slate-900"
                    }`}
                  >
                    {bt.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {bt.description}
                  </p>
                </div>
                {businessType === bt.value && (
                  <CheckCircle2 className="h-5 w-5 text-teal-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!businessType}
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Compliance Items */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Select your compliance items
            </h2>
            <p className="text-sm text-slate-500">
              We&apos;ve pre-selected common items for{" "}
              <span className="font-medium text-slate-700">
                {BUSINESS_TYPES.find((bt) => bt.value === businessType)?.label}
              </span>{" "}
              contractors. Uncheck any that don&apos;t apply and add custom ones
              below.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100 animate-fade-in" style={{ animationDelay: "100ms" }}>
            {items.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                  item.selected ? "bg-white" : "bg-slate-50 opacity-60"
                }`}
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="flex-shrink-0"
                >
                  {item.selected ? (
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-300" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">
                      {getCategoryLabel(item.category)}
                    </span>
                    {item.isRecurring && item.recurringMonths && (
                      <>
                        <span className="text-xs text-slate-300">&middot;</span>
                        <span className="text-xs text-slate-500">
                          Renews every {item.recurringMonths} mo
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add custom item */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Add Custom Item
            </h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Fire Extinguisher Inspection"
                  className="input-base"
                />
              </div>
              <Select
                value={customCategory}
                onChange={(v) => setCustomCategory(v)}
                placeholder="Category"
                className="min-w-[160px]"
                options={[
                  { value: "business_license", label: "Business License" },
                  { value: "trade_license", label: "Trade License" },
                  { value: "insurance", label: "Insurance" },
                  { value: "certification", label: "Certification" },
                  { value: "inspection", label: "Inspection" },
                  { value: "permit", label: "Permit" },
                  { value: "safety_training", label: "Safety/Training" },
                  { value: "custom", label: "Custom" },
                ]}
              />
              <button
                onClick={addCustomItem}
                disabled={!customTitle.trim() || !customCategory}
                className="btn-secondary px-4 py-2.5 text-sm disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                {selectedCount} items selected
              </span>
              <button
                onClick={() => setStep(3)}
                disabled={selectedCount === 0}
                className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Set Dates & Confirm */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Set expiration dates
            </h2>
            <p className="text-sm text-slate-500">
              Add known expiration dates for your compliance items. You can
              always update these later.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100 animate-fade-in" style={{ animationDelay: "100ms" }}>
            {items
              .filter((i) => i.selected)
              .map((item, _filteredIndex) => {
                const originalIndex = items.indexOf(item);
                return (
                  <div
                    key={originalIndex}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getCategoryLabel(item.category)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 w-[200px]">
                      <DatePicker
                        value={item.expirationDate}
                        onChange={(v) => updateItemDate(originalIndex, v)}
                        placeholder="Set date"
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-teal-900">
                  Items without dates will default to 1 year from today
                </p>
                <p className="text-xs text-teal-700 mt-0.5">
                  You can update expiration dates anytime from the deadlines
                  page.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                "Setting up..."
              ) : (
                <>
                  Create {selectedCount} Deadlines
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl compliance-gradient flex items-center justify-center mx-auto shadow-lg animate-scale-in">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              You&apos;re all set!
            </h2>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              We created <span className="font-semibold text-teal-700">{createdCount} compliance deadlines</span> for
              your {BUSINESS_TYPES.find((bt) => bt.value === businessType)?.label || ""} business.
              Each one has automatic reminders at 30, 14, 7, 3, and 1 day before expiration.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 max-w-md mx-auto text-left animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">What&apos;s next?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Update expiration dates</p>
                  <p className="text-xs text-slate-500">Items without dates default to 1 year from today. Update them with your real dates.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Upload className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Upload your documents</p>
                  <p className="text-xs text-slate-500">Attach certificates, licenses, and policies. We&apos;ll try to detect expiration dates automatically.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <LayoutDashboard className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Check your dashboard</p>
                  <p className="text-xs text-slate-500">See your compliance coverage score and which items need attention.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <Link href="/deadlines" className="btn-secondary">
              View Deadlines
            </Link>
            <Link href="/dashboard" className="btn-primary">
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
