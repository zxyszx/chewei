import { DatabaseBackup, ShieldCheck } from "lucide-react";
import { PlatformSettings, ReminderSettings } from "@/components/settings-panels";
import { PageHeader, Badge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { configuredReminderDays } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "系统设置" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [setting, platforms, users] = await Promise.all([prisma.setting.findUnique({ where: { key: "reminderDays" } }), prisma.platform.findMany({ include: { _count: { select: { parkingSlots: true } } }, orderBy: { createdAt: "asc" } }), prisma.user.findMany({ orderBy: { createdAt: "asc" } })]);
  const days = configuredReminderDays(setting?.value);
  const admin = user.role === "ADMIN";
  return <div className="mx-auto max-w-[1200px] space-y-4"><PageHeader title="系统设置" description={admin ? "提醒、平台、管理员和数据维护" : "当前账号仅可查看设置"} />
    <section className="panel p-5"><div className="mb-4"><h2 className="font-semibold">到期提醒</h2><p className="mt-1 text-[12px] text-[var(--muted-foreground)]">用于总览和导航提醒，支持多个提前天数</p></div><ReminderSettings initialDays={days} editable={admin} /></section>
    <section className="panel overflow-hidden"><PlatformSettings platforms={platforms.map((platform) => ({ id: platform.id, name: platform.name, slug: platform.slug, icon: platform.icon, defaultCapacity: platform.defaultCapacity, status: platform.status, slotCount: platform._count.parkingSlots }))} editable={admin} /></section>
    <div className="grid gap-4 md:grid-cols-2"><section className="panel p-5"><div className="mb-4 flex items-center gap-2"><ShieldCheck size={18} className="text-[#2563eb]" /><h2 className="font-semibold">管理员</h2></div><div className="space-y-2">{users.map((item) => <div key={item.id} className="flex items-center justify-between rounded-[6px] border border-[var(--border)] px-3 py-2.5"><div><strong className="text-[13px]">{item.username}</strong><p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{item.role === "ADMIN" ? "管理员" : "操作员"}</p></div><Badge tone={item.status === "ACTIVE" ? "success" : "neutral"}>{item.status === "ACTIVE" ? "启用" : "停用"}</Badge></div>)}</div></section>
      <section className="panel p-5"><div className="mb-3 flex items-center gap-2"><DatabaseBackup size={18} className="text-[#087a55]" /><h2 className="font-semibold">数据备份</h2></div><p className="mb-4 text-[12px] leading-5 text-[var(--muted-foreground)]">导出所有平台、车位、车友和续费记录。生产环境还应定时备份 PostgreSQL 数据卷。</p><a className="btn" href="/api/backup"><DatabaseBackup size={15} />下载 JSON 备份</a></section></div>
  </div>;
}
