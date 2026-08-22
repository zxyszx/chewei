import { addDays, format, startOfMonth, subMonths } from "date-fns";
import { CalendarClock, CircleParking, Coins, UsersRound } from "lucide-react";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { PageHeader } from "@/components/ui";
import { databaseToday, monthRange, slotStatus } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "数据统计" };

export default async function AnalyticsPage() {
  const now = new Date();
  const today = databaseToday(now);
  const [platforms, members, renewals, expiring7, expiring30] =
    await Promise.all([
      prisma.platform.findMany({
        include: {
          parkingSlots: {
            include: { members: { where: { status: "ACTIVE" } } },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.member.count({ where: { status: "ACTIVE" } }),
      prisma.renewal.findMany({
        where: { createdAt: { gte: startOfMonth(subMonths(now, 5)) } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.member.count({
        where: {
          status: "ACTIVE",
          expireDate: { gte: today, lte: addDays(today, 7) },
        },
      }),
      prisma.member.count({
        where: {
          status: "ACTIVE",
          expireDate: { gte: today, lte: addDays(today, 30) },
        },
      }),
    ]);
  const slots = platforms.flatMap((p) => p.parkingSlots);
  const currentRenewals = renewals.filter(
    (r) => r.createdAt >= monthRange(now).gte,
  );
  const renewalData = Array.from({ length: 6 }, (_, index) => {
    const date = subMonths(now, 5 - index);
    const key = format(date, "yyyy-MM");
    const monthRows = renewals.filter(
      (r) => format(r.createdAt, "yyyy-MM") === key,
    );
    return {
      month: format(date, "M 月"),
      amount: monthRows.reduce((sum, row) => sum + Number(row.amount), 0),
      count: monthRows.length,
    };
  });
  const metrics = [
    [
      "合租车位",
      slots.length,
      `${slots.filter((s) => slotStatus(s.capacity, s.members.length, s.status) === "满").length} 个已满`,
      CircleParking,
      "text-[#2563eb] bg-[#eef4ff]",
    ],
    [
      "车友总数",
      members,
      "当前在位",
      UsersRound,
      "text-[#087a55] bg-[#eaf8f1]",
    ],
    [
      "本月续费金额",
      `¥ ${currentRenewals.reduce((sum, r) => sum + Number(r.amount), 0).toFixed(2)}`,
      `${currentRenewals.length} 人次`,
      Coins,
      "text-[#b45309] bg-[#fff5e8]",
    ],
    [
      "未来到期",
      expiring7,
      `7 天内 · 30 天内 ${expiring30}`,
      CalendarClock,
      "text-[#c93636] bg-[#fff0f0]",
    ],
  ] as const;
  return (
    <div className="mx-auto max-w-[1700px] space-y-4">
      <PageHeader
        title="数据统计"
        description="合租车位使用率、续费与到期趋势"
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, detail, Icon, tone]) => (
          <div className="panel flex items-center gap-4 p-4" key={label}>
            <div
              className={`grid size-10 place-items-center rounded-[7px] ${tone}`}
            >
              <Icon size={20} />
            </div>
            <div>
              <p className="text-[12px] text-[var(--muted-foreground)]">
                {label}
              </p>
              <strong className="mt-1 block text-[22px] font-semibold tabular">
                {value}
              </strong>
              <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                {detail}
              </p>
            </div>
          </div>
        ))}
      </section>
      <AnalyticsCharts
        platformData={platforms.map((p) => ({
          name: p.name,
          slots: p.parkingSlots.length,
          members: p.parkingSlots.reduce(
            (sum, slot) => sum + slot.members.length,
            0,
          ),
        }))}
        renewalData={renewalData}
      />
    </div>
  );
}
