import { differenceInDays } from "date-fns";

// Statuses where data is not yet verified — reminders are blocked
const UNVERIFIED_STATUSES = ["uploaded", "scanned", "needs_review"];

export function computeStatus(expirationDate: Date, currentStatus: string): string {
  // Terminal states
  if (currentStatus === "completed" || currentStatus === "archived") {
    return currentStatus;
  }

  const now = new Date();
  const daysUntil = differenceInDays(expirationDate, now);

  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 30) return "due_soon";
  return "active";
}

export function computeVerificationStatus(
  scanConfidence: string | null,
  hasDocuments: boolean
): string {
  if (!hasDocuments) return "verified"; // Manual entry — skip verification
  if (!scanConfidence) return "uploaded";
  if (scanConfidence === "high") return "verified";
  if (scanConfidence === "medium") return "needs_review";
  return "needs_review"; // low confidence
}

export function isUnverified(verificationStatus: string): boolean {
  return UNVERIFIED_STATUSES.includes(verificationStatus);
}

export function shouldSendReminders(verificationStatus: string, status: string): boolean {
  // Only send reminders for verified items that are active/due_soon/overdue
  if (isUnverified(verificationStatus)) return false;
  if (status === "completed" || status === "archived") return false;
  return true;
}

export function getDaysUntil(expirationDate: Date): number {
  return differenceInDays(new Date(expirationDate), new Date());
}

export function getUrgencyLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days} days left`;
}
