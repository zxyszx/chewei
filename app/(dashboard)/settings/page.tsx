import { BellRing, Database, LayoutGrid, RefreshCw, Users } from "lucide-react";
import Link from "next/link";
import { PlatformSettings, ReminderSettings, SystemMaintenance, UserSettings } from "@/components/settings-panels";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { configuredReminderDays } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "系统设置" };

const tabs = [
  { id: "reminders", label: "提醒设置", icon: BellRing },
  { id: "platforms", label: "平台管理", icon: LayoutGrid },
  { id: "users", label: "管理员", icon: Users },
  { id: "backup", label: "数据备份", icon: Database },
  { id: "update", label: "系统更新", icon: RefreshCw },
] as const;

type SettingsTab = (typeof tabs)[number]["id"];

function selectedTab(value: string | string[] | undefined): SettingsTab {
  const candidate = Array.isArray(value) ? value[0] : value;
  return tabs.some((tab) => tab.id === candidate) ? candidate as SettingsTab : "reminders";
}

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const [user, query] = await Promise.all([requireUser(), searchParams]);
  const activeTab = selectedTab(query.tab);
  const admin = user.role === "ADMIN";

  let content: React.ReactNode;
  if (activeTab === "reminders") {
    const setting = await prisma.setting.findUnique({ where: { key: "reminderDays" } });
    content = <section className="panel p-5"><div className="mb-4"><h2 className="font-semibold">到期提醒</h2><p className="mt-1 text-[12px] text-[var(--muted-foreground)]">用于总览和导航提醒，支持多个提前天数</p></div><ReminderSettings initialDays={configuredReminderDays(setting?.value)} editable={admin} /></section>;
  } else if (activeTab === "platforms") {
    const platforms = await prisma.platform.findMany({ include: { _count: { select: { parkingSlots: true } } }, orderBy: { createdAt: "asc" } });
    content = <section className="panel overflow-hidden"><PlatformSettings platforms={platforms.map((platform) => ({ id: platform.id, name: platform.name, slug: platform.slug, icon: platform.icon, defaultCapacity: platform.defaultCapacity, status: platform.status, slotCount: platform._count.parkingSlots }))} editable={admin} /></section>;
  } else if (activeTab === "users") {
    const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, status: true }, orderBy: { createdAt: "asc" } });
    content = <UserSettings users={users.map((item) => ({ id: item.id, username: item.username, role: item.role, status: item.status }))} currentUserId={user.id} editable={admin} />;
  } else if (activeTab === "backup") {
    content = <SystemMaintenance editable={admin} view="backup" />;
  } else {
    content = <SystemMaintenance editable={admin} view="update" />;
  }

  return <div className="mx-auto max-w-[1500px] space-y-4"><PageHeader title="系统设置" description={admin ? "管理提醒、平台、管理员与数据维护" : "当前账号仅可查看设置"} />
    <nav className="panel flex min-h-[52px] overflow-x-auto p-1" aria-label="设置分类">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return <Link key={tab.id} href={`/settings?tab=${tab.id}`} scroll={false} aria-current={active ? "page" : undefined} className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[5px] px-4 text-[12px] font-semibold transition-[background,color,box-shadow] duration-150 ${active ? "bg-[var(--surface-subtle)] text-[var(--accent)] shadow-[inset_0_0_0_1px_var(--border)]" : "text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"}`}><Icon size={15} aria-hidden="true" />{tab.label}</Link>;
      })}
    </nav>
    {content}
  </div>;
}
