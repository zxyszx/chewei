import { addDays } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { configuredReminderDays, databaseToday } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const reminderSetting = await prisma.setting.findUnique({ where: { key: "reminderDays" } });
  const reminderDays = configuredReminderDays(reminderSetting?.value);
  const reminderCutoff = Math.max(...reminderDays);
  const today = databaseToday();
  const reminderCount = await prisma.member.count({ where: { status: "ACTIVE", expireDate: { lte: addDays(today, reminderCutoff) } } });
  return <AppShell reminderCount={reminderCount} username={user.username} role={user.role}>{children}</AppShell>;
}
