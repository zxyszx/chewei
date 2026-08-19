import { differenceInCalendarDays, endOfMonth, startOfMonth } from "date-fns";

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
