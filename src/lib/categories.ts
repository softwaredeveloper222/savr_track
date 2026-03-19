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

export function getCategoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function getStatusInfo(value: string) {
  return STATUSES.find((s) => s.value === value) || STATUSES[0];
}
