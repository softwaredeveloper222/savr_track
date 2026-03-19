import { differenceInDays } from "date-fns";

export function computeStatus(expirationDate: Date, currentStatus: string): string {
  if (currentStatus === "completed" || currentStatus === "archived") {
    return currentStatus;
  }

  const now = new Date();
  const daysUntil = differenceInDays(expirationDate, now);

  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 30) return "due_soon";
  return "active";
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
