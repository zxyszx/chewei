import { addDays, format, startOfMonth, subMonths } from "date-fns";
import { CalendarClock, ChartNoAxesCombined, Coins, UsersRound } from "lucide-react";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { MetricCard, PageHeader, ProgressBar } from "@/components/ui";
import { databaseToday, dayDiff, monthRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { seatMetrics } from "@/lib/seat-metrics";

export const metadata = { title: "数据统计" };

export default async function AnalyticsPage() {
  const now = new Date(); const today = databaseToday(now);
  const [platforms, activeMembers, renewals, expiring30] = await Promise.all([
    prisma.platform.findMany({ include: { parkingSlots: { where: { status: "ACTIVE" }, include: { members: { where: { status: "ACTIVE" } } } } }, orderBy: { createdAt: "asc" } }),
    prisma.member.count({ where: { status: "ACTIVE", slot: { status: "ACTIVE" } } }),
    prisma.renewal.findMany({ where: { createdAt: { gte: startOfMonth(subMonths(now, 5)) } }, orderBy: { createdAt: "asc" } }),
    prisma.member.findMany({ where: { status: "ACTIVE", expireDate: { gte: today, lte: addDays(today, 30) } }, select: { expireDate: true } }),
  ]);
  const slots = platforms.flatMap((platform) => platform.parkingSlots);
  const { capacity, occupied, utilization } = seatMetrics(slots);
  const currentRenewals = renewals.filter((record) => record.createdAt >= monthRange(now).gte);
  const renewalData = Array.from({ length: 6 }, (_, index) => { const date = subMonths(now, 5 - index); const key = format(date, "yyyy-MM"); return { month: format(date, "M 月"), amount: renewals.filter((record) => format(record.createdAt, "yyyy-MM") === key).reduce((sum, record) => sum + Number(record.amount), 0) }; });
  const expiryData = [{ range: "今天", count: expiring30.filter((member) => dayDiff(member.expireDate, today) === 0).length }, { range: "1-7 天", count: expiring30.filter((member) => { const days = dayDiff(member.expireDate, today); return days >= 1 && days <= 7; }).length }, { range: "8-15 天", count: expiring30.filter((member) => { const days = dayDiff(member.expireDate, today); return days >= 8 && days <= 15; }).length }, { range: "16-30 天", count: expiring30.filter((member) => { const days = dayDiff(member.expireDate, today); return days >= 16 && days <= 30; }).length }];
  const platformData = platforms.map((platform) => { const platformCapacity = platform.parkingSlots.reduce((sum, slot) => sum + slot.capacity, 0); const used = platform.parkingSlots.reduce((sum, slot) => sum + slot.members.length, 0); return { name: platform.name, used, capacity: platformCapacity, percent: platformCapacity ? Math.round((used / platformCapacity) * 100) : 0 }; }).filter((item) => item.capacity > 0);
  return <div className="mx-auto max-w-[1700px] space-y-4">
    <PageHeader title="数据统计" description="了解席位利用率、收入与到期趋势" />
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><MetricCard label="整体席位利用率" value={`${utilization}%`} icon={<ChartNoAxesCombined size={22} />} tone="green" detail={<><ProgressBar value={utilization} label={`整体席位利用率 ${utilization}%`} tone="green" /><span className="mt-1 block">{occupied} / {capacity} 个席位</span></>} /><MetricCard label="在位车友" value={activeMembers} icon={<UsersRound size={22} />} tone="green" detail="有效账号内在位成员" /><MetricCard label="本月续费收入" value={`¥ ${currentRenewals.reduce((sum, record) => sum + Number(record.amount), 0).toFixed(2)}`} icon={<Coins size={22} />} tone="orange" detail={`${currentRenewals.length} 笔续费`} /><MetricCard label="30 天内到期" value={expiring30.length} icon={<CalendarClock size={22} />} tone="red" detail="需要提前提醒" /></section>
    <AnalyticsCharts platformData={platformData} renewalData={renewalData} seatData={[{ name: "已占用", value: occupied, color: "var(--chart-2)" }, { name: "剩余", value: Math.max(0, capacity - occupied), color: "var(--chart-4)" }]} expiryData={expiryData} />
  </div>;
}
