import { format, startOfMonth } from "date-fns";
import { Activity, AlertTriangle, ArrowRight, BellRing, CalendarClock, CircleParking, Plus, ReceiptText, ShieldAlert, UsersRound } from "lucide-react";
import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import { Badge, MetricCard, PageHeader, ProgressBar } from "@/components/ui";
import { databaseToday, dayDiff, expiryLabel, slotStatus } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { seatMetrics } from "@/lib/seat-metrics";

export const metadata = { title: "总览" };

const operationNames: Record<string, string> = {
  SEED_DATABASE: "初始化数据",
  CREATE_SLOT: "创建合租车位", UPDATE_SLOT: "编辑合租车位", DELETE_SLOT: "删除合租车位",
  ADD_MEMBER: "添加车友", UPDATE_MEMBER: "编辑车友", DELETE_MEMBER: "删除车友",
  EXIT_MEMBER: "车友退出", MOVE_MEMBER: "更换账号席位", RENEW_MEMBER: "续费",
  VIEW_PASSWORD: "查看密码", UPDATE_SETTINGS: "修改设置", UPDATE_PLATFORM: "修改平台",
  CREATE_PLATFORM: "新增平台", DELETE_PLATFORM: "删除平台", CREATE_USER: "创建后台账号", UPDATE_USER: "修改后台账号",
};

export default async function OverviewPage() {
  const today = databaseToday();
  const [slots, monthlyRevenue, recentOperations] = await Promise.all([
    prisma.parkingSlot.findMany({ include: { platform: true, members: { where: { status: "ACTIVE" }, orderBy: { expireDate: "asc" } } }, orderBy: { updatedAt: "desc" } }),
    prisma.renewal.aggregate({ where: { createdAt: { gte: startOfMonth(today) } }, _sum: { amount: true } }),
    prisma.operationLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);

  const { activeSlots, capacity: totalCapacity, occupied, remaining, utilization } = seatMetrics(slots);
  const occupancy = Math.round(utilization);
  const allMembers = slots.flatMap((slot) => slot.members.map((member) => ({ ...member, slot })));
  const dueToday = allMembers.filter((member) => dayDiff(member.expireDate, today) === 0).length;
  const due7 = allMembers.filter((member) => { const days = dayDiff(member.expireDate, today); return days >= 0 && days <= 7; }).length;
  const due30 = allMembers.filter((member) => { const days = dayDiff(member.expireDate, today); return days >= 0 && days <= 30; }).length;
  const expired = allMembers.filter((member) => dayDiff(member.expireDate, today) < 0).length;
  const abnormal = slots.filter((slot) => slot.status === "ABNORMAL" || slot.status === "PAUSED").length;
  const pendingItems = [
    ["今日到期", dueToday, "/reminders?range=today", CalendarClock, "red"],
    ["7 天内到期", due7, "/reminders?range=7", BellRing, "orange"],
    ["30 天内到期", due30, "/reminders?range=30", CalendarClock, "orange"],
    ["已过期", expired, "/reminders?range=expired", AlertTriangle, "red"],
    ["异常或停用账号", abnormal, "/slots?status=attention", ShieldAlert, "red"],
  ] as const;
  const platforms = [...new Map(slots.map((slot) => [slot.platformId, slot.platform])).values()].map((platform) => {
    const platformSlots = activeSlots.filter((slot) => slot.platformId === platform.id);
    const capacity = platformSlots.reduce((sum, slot) => sum + slot.capacity, 0);
    const used = platformSlots.reduce((sum, slot) => sum + slot.members.length, 0);
    return { ...platform, capacity, used, percentage: capacity ? Math.round((used / capacity) * 100) : 0 };
  }).filter((platform) => platform.capacity > 0).sort((a, b) => b.percentage - a.percentage);

  return <div className="mx-auto max-w-[1700px] space-y-5">
    <PageHeader title="总览" description="共享账号、席位与续费经营概况" actions={<Link href="/slots?create=1" className="btn btn-primary"><Plus size={17} />新增车位</Link>} />
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="核心指标">
      <MetricCard label="合租账号" value={slots.length} detail={`${activeSlots.length} 个有效账号`} icon={<CircleParking size={22} />} tone="blue" />
      <article className="panel metric-card col-span-2 xl:col-span-1"><div className="flex items-center justify-between gap-3"><div><p className="text-[13px] font-medium text-[var(--muted-foreground)]">在位席位 / 总席位</p><strong className="mt-1 block text-[26px] font-bold tabular"><span className="text-[var(--accent)]">{occupied}</span> / {totalCapacity}</strong></div><span className="badge badge-blue text-[14px]">{occupancy}%</span></div><div className="mt-4"><ProgressBar value={occupancy} label={`整体席位占用率 ${occupancy}%`} /><p className="mt-2 text-[12px] text-[var(--muted-foreground)]">整体占用率 {occupancy}%</p></div></article>
      <MetricCard label="剩余席位" value={remaining} detail="有效账号可分配席位" icon={<UsersRound size={22} />} tone="green" />
      <MetricCard label="本月续费收入" value={`¥ ${Number(monthlyRevenue._sum.amount || 0).toFixed(2)}`} detail="本月已到账金额" icon={<ReceiptText size={22} />} tone="orange" />
    </section>

    <section aria-labelledby="pending-title"><h2 id="pending-title" className="section-heading mb-3">待处理事项</h2><div className="panel grid overflow-hidden sm:grid-cols-2 xl:grid-cols-5">{pendingItems.map(([label, value, href, Icon, tone], index) => <Link key={label} href={href} className={`group flex min-h-[88px] items-center gap-3 border-b border-[var(--border)] p-4 transition-colors hover:bg-[var(--surface-subtle)] sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r ${index === pendingItems.length - 1 ? "xl:border-r-0" : ""}`}><span className={`metric-icon size-10 ${tone === "red" ? "icon-tone-red" : "icon-tone-orange"}`}><Icon size={19} /></span><span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold">{label}</span><strong className={`mt-1 block text-[20px] tabular ${tone === "red" ? "text-[var(--danger)]" : "text-[var(--warning)]"}`}>{value}</strong></span><ArrowRight size={16} className="text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5" /></Link>)}</div></section>

    <section className="grid items-start gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div><div className="mb-3 flex items-center justify-between"><h2 className="section-heading">平台占用率</h2><Link href="/analytics" className="text-[13px] font-semibold text-[var(--accent)]">查看统计</Link></div><div className="panel divide-y divide-[var(--border)]">{platforms.map((platform) => <div key={platform.id} className="grid grid-cols-[minmax(110px,0.7fr)_minmax(120px,1.8fr)_72px] items-center gap-4 px-5 py-4"><span className="flex min-w-0 items-center gap-3"><PlatformIcon slug={platform.slug} name={platform.name} icon={platform.icon} size={28} className="border border-[var(--border)]" /><strong className="truncate text-[13px]">{platform.name}</strong></span><ProgressBar value={platform.percentage} label={`${platform.name} 席位占用率 ${platform.percentage}%`} /><span className="text-right text-[12px] tabular"><strong>{platform.percentage}%</strong><span className="mt-0.5 block text-[var(--muted-foreground)]">{platform.used}/{platform.capacity}</span></span></div>)}{!platforms.length && <div className="empty">暂无有效平台席位</div>}</div></div>
      <div><div className="mb-3 flex items-center justify-between"><h2 className="section-heading">最近操作</h2><Link href="/logs" className="text-[13px] font-semibold text-[var(--accent)]">查看全部</Link></div><div className="panel divide-y divide-[var(--border)]">{recentOperations.map((log) => <div key={log.id} className="flex min-h-[66px] items-center gap-3 px-5 py-3"><span className="metric-icon size-9 icon-tone-blue"><Activity size={17} /></span><div className="min-w-0 flex-1"><p className="truncate text-[13px]"><strong>{log.user.username}</strong> · {operationNames[log.action] || log.action}</p><p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{log.resourceType}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ""}</p></div><time className="shrink-0 text-[11px] tabular text-[var(--muted-foreground)]">{format(log.createdAt, "MM.dd HH:mm")}</time></div>)}{!recentOperations.length && <div className="empty">暂无操作记录</div>}</div></div>
    </section>

    <section><div className="mb-3 flex items-center justify-between"><h2 className="section-heading">最近合租账号</h2><Link href="/slots" className="text-[13px] font-semibold text-[var(--accent)]">查看全部</Link></div><div className="panel overflow-hidden"><div className="data-wrap responsive-table-desktop"><table className="data-table"><thead><tr><th>账号编号</th><th>平台</th><th>登录账号</th><th>状态</th><th>席位占用</th><th>最近到期</th></tr></thead><tbody>{slots.slice(0, 8).map((slot) => { const status = slotStatus(slot.capacity, slot.members.length, slot.status); const next = slot.members[0]; const percent = slot.capacity ? (slot.members.length / slot.capacity) * 100 : 0; return <tr key={slot.id}><td><Link href={`/slots?open=${slot.id}`} className="font-semibold text-[var(--accent)]">#{slot.slotNumber}</Link></td><td><span className="flex items-center gap-2"><PlatformIcon slug={slot.platform.slug} name={slot.platform.name} icon={slot.platform.icon} size={18} />{slot.platform.name}</span></td><td className="max-w-[280px] truncate">{slot.accountEmail}</td><td><Badge tone={status === "满" ? "success" : status === "异常" ? "danger" : status === "暂停" ? "warning" : "blue"}>{status}</Badge></td><td><div className="flex min-w-[150px] items-center gap-3"><span className="w-9 tabular">{slot.members.length}/{slot.capacity}</span><div className="flex-1"><ProgressBar value={percent} label={`${slot.platform.name} #${slot.slotNumber} 席位占用`} /></div></div></td><td>{next ? <Badge tone={expiryLabel(next.expireDate, today).tone}>{expiryLabel(next.expireDate, today).text}</Badge> : "-"}</td></tr>; })}</tbody></table></div><div className="mobile-record-list">{slots.slice(0, 6).map((slot) => { const status = slotStatus(slot.capacity, slot.members.length, slot.status); const next = slot.members[0]; const percent = slot.capacity ? (slot.members.length / slot.capacity) * 100 : 0; return <Link href={`/slots?open=${slot.id}`} key={slot.id} className="mobile-record block"><div className="flex items-start gap-3"><PlatformIcon slug={slot.platform.slug} name={slot.platform.name} icon={slot.platform.icon} size={36} className="border border-[var(--border)]" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><strong className="truncate">{slot.accountEmail}</strong><Badge tone={status === "满" ? "success" : "blue"}>{status}</Badge></div><p className="mt-1 text-[12px] text-[var(--muted-foreground)]">{slot.platform.name} #{slot.slotNumber}</p></div></div><div className="mt-3 flex items-center gap-3"><div className="flex-1"><ProgressBar value={percent} label={`席位占用 ${slot.members.length}/${slot.capacity}`} /></div><span className="text-[12px] tabular">{slot.members.length}/{slot.capacity}</span>{next && <Badge tone={expiryLabel(next.expireDate, today).tone}>{expiryLabel(next.expireDate, today).text}</Badge>}</div></Link>; })}</div></div></section>
  </div>;
}
