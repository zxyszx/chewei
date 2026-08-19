import { differenceInCalendarDays, endOfMonth, startOfMonth } from "date-fns";

export const DEFAULT_REMINDER_DAYS = [3, 7, 15, 30];

export function databaseToday(now = new Date()) {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function databaseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function configuredReminderDays(value: unknown) {
  if (!Array.isArray(value)) return DEFAULT_REMINDER_DAYS;
  const days = [...new Set(value.map(Number).filter((day) => Number.isInteger(day) && day > 0 && day <= 365))].sort((a, b) => a - b);
  return days.length ? days : DEFAULT_REMINDER_DAYS;
}

export function dayDiff(date: Date, now = new Date()) {
  return differenceInCalendarDays(date, now);
}

export function expiryLabel(date: Date, now = new Date()) {
  const days = dayDiff(date, now);
  if (days < 0) return { text: `已过期 ${Math.abs(days)} 天`, tone: "danger" as const, days };
  if (days === 0) return { text: "今天到期", tone: "danger" as const, days };
  if (days <= 3) return { text: `${days} 天内`, tone: "urgent" as const, days };
  if (days <= 7) return { text: `${days} 天内`, tone: "warning" as const, days };
  if (days <= 30) return { text: `${days} 天内`, tone: "notice" as const, days };
  return { text: `${days} 天`, tone: "success" as const, days };
}

export function slotStatus(capacity: number, activeMembers: number, recordStatus = "ACTIVE") {
  if (recordStatus === "PAUSED") return "暂停";
  if (recordStatus === "ABNORMAL") return "异常";
  if (activeMembers <= 0) return "空闲";
  const open = Math.max(0, capacity - activeMembers);
  return open === 0 ? "满" : `缺${open}`;
}

export function monthRange(now = new Date()) {
  return { gte: startOfMonth(now), lte: endOfMonth(now) };
}
