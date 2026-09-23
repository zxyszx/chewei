import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { configuredReminderDays, databaseToday, dayDiff, nextMonthlyBillingDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const REMINDER_CACHE_MS = 15_000;
const globalForDashboard = globalThis as unknown as {
  parkingReminderCache?: { expiresAt: number; count: number };
};

async function getReminderCount() {
  const cached = globalForDashboard.parkingReminderCache;
  if (cached && cached.expiresAt > Date.now()) return cached.count;

  const reminderSetting = await prisma.setting.findUnique({ where: { key: "reminderDays" } });
  const reminderDays = configuredReminderDays(reminderSetting?.value);
  const reminderCutoff = Math.max(...reminderDays);
  const today = databaseToday();
  const slots = await prisma.parkingSlot.findMany({ select: { billingDay: true } });
  const count = slots.filter((slot) => dayDiff(nextMonthlyBillingDate(slot.billingDay, today), today) <= reminderCutoff).length;
  globalForDashboard.parkingReminderCache = { expiresAt: Date.now() + REMINDER_CACHE_MS, count };
  return count;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, reminderCount] = await Promise.all([
    requireUser(),
    getReminderCount(),
  ]);
  return <AppShell reminderCount={reminderCount} username={user.username} role={user.role}>{children}</AppShell>;
}
