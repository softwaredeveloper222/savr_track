export const CATEGORIES = [
  { value: "business_license", label: "Business License", icon: "Building2" },
  { value: "trade_license", label: "Trade License", icon: "Wrench" },
  { value: "insurance", label: "Insurance Policy", icon: "Shield" },
  { value: "certification", label: "Certification", icon: "Award" },
  { value: "inspection", label: "Inspection", icon: "ClipboardCheck" },
  { value: "permit", label: "Permit", icon: "FileCheck" },
  { value: "filing", label: "Annual Filing", icon: "FileText" },
  { value: "tax", label: "Tax Reminder", icon: "Receipt" },
  { value: "vendor_doc", label: "Vendor Document", icon: "Users" },
  { value: "site_requirement", label: "Site / Job Requirement", icon: "HardHat" },
  { value: "safety_training", label: "Safety / Training", icon: "GraduationCap" },
  { value: "coi", label: "Certificate of Insurance", icon: "ShieldCheck" },
  { value: "operational", label: "Operational Deadline", icon: "Clock" },
  { value: "custom", label: "Custom", icon: "Plus" },
] as const;

export const STATUSES = [
  { value: "active", label: "Active", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "due_soon", label: "Due Soon", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "completed", label: "Completed", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "pending_confirmation", label: "Pending Confirmation", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "archived", label: "Archived", color: "bg-gray-100 text-gray-600 border-gray-200" },
] as const;

export const VERIFICATION_STATUSES = [
  { value: "uploaded", label: "Uploaded", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "scanned", label: "Scanned", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { value: "needs_review", label: "Needs Review", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "verified", label: "Verified", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
] as const;

export function getVerificationStatusInfo(value: string) {
  return VERIFICATION_STATUSES.find((s) => s.value === value) || VERIFICATION_STATUSES[0];
}

export function getCategoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function getStatusInfo(value: string) {
  return STATUSES.find((s) => s.value === value) || STATUSES[0];
}
