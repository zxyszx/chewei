import { format, startOfMonth } from "date-fns";
import { Bell, CalendarClock, ChevronRight, CircleDashed, CircleParking, Coins, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { ContactValue } from "@/components/contact-method";
import { PlatformIcon } from "@/components/platform-icon";
import { RevenueCalendar } from "@/components/revenue-calendar";
import { dayDiff, databaseToday } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { seatMetrics } from "@/lib/seat-metrics";

export const metadata = { title: "总览" };

export default async function OverviewPage() {
  const today = databaseToday();
  const [slots, renewals, monthlyRevenue] = await Promise.all([
    prisma.parkingSlot.findMany({
      include: {
        platform: true,
        members: { where: { status: "ACTIVE" }, orderBy: { expireDate: "asc" }, include: { renewals: { orderBy: { createdAt: "desc" }, take: 1 } } },
      },
      orderBy: { slotNumber: "asc" },
    }),
    prisma.renewal.findMany({ select: { createdAt: true, amount: true }, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.renewal.aggregate({ where: { createdAt: { gte: startOfMonth(today) } }, _sum: { amount: true } }),
  ]);

  const { activeSlots, capacity, occupied, remaining } = seatMetrics(slots);
  const members = slots.flatMap((slot) => slot.members.map((member) => ({ ...member, slot, days: dayDiff(member.expireDate, today), amount: Number(member.renewals[0]?.amount || 0) }))).sort((a, b) => a.expireDate.getTime() - b.expireDate.getTime());
  const due7 = members.filter((member) => member.days >= 0 && member.days <= 7).length;
  const expired = members.filter((member) => member.days < 0).length;
  const platforms = [...new Map(activeSlots.map((slot) => [slot.platformId, slot.platform])).values()].map((platform) => {
    const platformSlots = activeSlots.filter((slot) => slot.platformId === platform.id);
    const total = platformSlots.reduce((sum, slot) => sum + slot.capacity, 0);
    const used = platformSlots.reduce((sum, slot) => sum + slot.members.length, 0);
    return { ...platform, total, used };
  }).filter((platform) => platform.total > 0).sort((a, b) => b.used - a.used || a.name.localeCompare(b.name));

  const metrics = [
    ["总车位", capacity, CircleParking], ["已占用", occupied, UserRoundCheck], ["剩余", remaining, CircleDashed],
    ["7 天内到期", due7, CalendarClock], ["已过期", expired, Bell], ["本月收入", `¥ ${Number(monthlyRevenue._sum.amount || 0).toFixed(2)}`, Coins],
  ] as const;

  return <div className="dashboard-page">
    <section className="dashboard-stats" aria-label="车位统计">{metrics.map(([label, value, Icon]) => <article className="dashboard-stat panel" key={label}><div className="dashboard-stat-label"><span>{label}</span><Icon size={16} aria-hidden /></div><strong>{value}</strong></article>)}</section>

    <RevenueCalendar renewals={renewals.map((item) => ({ createdAt: item.createdAt.toISOString(), amount: Number(item.amount) }))} />

    <section className="dashboard-split">
      <article className="dashboard-list panel">
        <DashboardHeader title="即将到期" subtitle="最近需要处理的席位" href="/reminders" />
        <div>{members.slice(0, 4).map((member) => <Link href={`/slots?open=${member.slot.id}`} className="upcoming-row" key={member.id}>
          <PlatformIcon slug={member.slot.platform.slug} name={member.slot.platform.name} icon={member.slot.platform.icon} size={16} />
          <span className="row-primary"><strong>{member.slot.platform.name} / {member.seatNumber ? `${member.seatNumber}号位` : member.nickname}</strong><small>{format(member.expireDate, "yyyy/MM/dd")} · ¥{member.amount.toFixed(2)}</small></span>
          <Expiry days={member.days} />
        </Link>)}{members.length === 0 && <Empty>暂无待续费成员</Empty>}</div>
      </article>

      <article className="dashboard-list panel">
        <DashboardHeader title="平台概览" subtitle="各平台席位使用情况" href="/analytics" />
        <div>{platforms.slice(0, 4).map((platform) => { const percentage = Math.round(platform.used / platform.total * 100); return <Link href="/analytics" className="platform-row" key={platform.id}>
          <PlatformIcon slug={platform.slug} name={platform.name} icon={platform.icon} size={16} />
          <span className="row-primary"><span className="platform-count"><strong>{platform.name}</strong><small>{platform.used} / {platform.total}</small></span><span className="platform-track"><i style={{ width: `${percentage}%` }} /></span></span>
          <small className="platform-remaining">剩 {Math.max(platform.total - platform.used, 0)} 位</small>
        </Link>; })}{platforms.length === 0 && <Empty>暂无平台数据</Empty>}</div>
      </article>
    </section>

    <section className="dashboard-members panel">
      <DashboardHeader title="成员" href="/members" />
      {members.length > 0 ? <div className="member-grid">{members.slice(0, 6).map((member) => <Link href={`/members?open=${member.id}`} className="member-cell" key={member.id}>
        <ContactValue type={member.contactType} value={member.contact} className="member-contact" copyable={false} />
        <span className="member-platform"><PlatformIcon slug={member.slot.platform.slug} name={member.slot.platform.name} icon={member.slot.platform.icon} size={13} /> <strong>{member.slot.platform.name} / {member.seatNumber ? `${member.seatNumber}号位` : member.nickname}</strong></span>
        <strong className="member-amount">¥{member.amount.toFixed(2)}</strong>
        <small className="member-meta">{member.slot.accountEmail} · {format(member.expireDate, "yyyy/MM/dd")}</small>
        <span className="member-status">在位</span>
      </Link>)}</div> : <Empty>暂无成员账号</Empty>}
    </section>
  </div>;
}

function DashboardHeader({ title, subtitle, href }: { title: string; subtitle?: string; href: string }) {
  return <div className="dashboard-card-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><Link href={href} className="dashboard-all">全部 <ChevronRight size={13} /></Link></div>;
}

function Expiry({ days }: { days: number }) {
  const text = days < 0 ? `已过期 ${Math.abs(days)} 天` : days === 0 ? "今天到期" : `剩 ${days} 天`;
  return <span className={days < 0 ? "expiry expiry-danger" : days <= 7 ? "expiry expiry-warning" : "expiry"}>{text}</span>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="dashboard-empty">{children}</div>;
}
