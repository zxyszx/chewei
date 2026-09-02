import { PlatformSettings, ReminderSettings, SystemMaintenance, UserSettings } from "@/components/settings-panels";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { configuredReminderDays } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "系统设置" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [setting, platforms, users] = await Promise.all([prisma.setting.findUnique({ where: { key: "reminderDays" } }), prisma.platform.findMany({ include: { _count: { select: { parkingSlots: true } } }, orderBy: { createdAt: "asc" } }), prisma.user.findMany({ select: { id: true, username: true, role: true, status: true }, orderBy: { createdAt: "asc" } })]);
  const days = configuredReminderDays(setting?.value);
  const admin = user.role === "ADMIN";
  return <div className="mx-auto max-w-[1200px] space-y-4"><PageHeader title="系统设置" description={admin ? "提醒、平台、管理员和数据维护" : "当前账号仅可查看设置"} />
    <section className="panel p-5"><div className="mb-4"><h2 className="font-semibold">到期提醒</h2><p className="mt-1 text-[12px] text-[var(--muted-foreground)]">用于总览和导航提醒，支持多个提前天数</p></div><ReminderSettings initialDays={days} editable={admin} /></section>
    <section id="platforms" className="panel scroll-mt-20 overflow-hidden"><PlatformSettings platforms={platforms.map((platform) => ({ id: platform.id, name: platform.name, slug: platform.slug, icon: platform.icon, defaultCapacity: platform.defaultCapacity, status: platform.status, slotCount: platform._count.parkingSlots }))} editable={admin} /></section>
    <UserSettings users={users.map((item) => ({ id: item.id, username: item.username, role: item.role, status: item.status }))} currentUserId={user.id} editable={admin} />
    <SystemMaintenance editable={admin} />
  </div>;
}
