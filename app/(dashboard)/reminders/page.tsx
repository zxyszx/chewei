import { format } from "date-fns";
import { CalendarClock, CircleDollarSign, Clock3 } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { PlatformIcon } from "@/components/platform-icon";
import { Badge, PageHeader } from "@/components/ui";
import { databaseToday, dayDiff, nextMonthlyBillingDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "订阅续费" };

const tabs = [
  ["all", "全部账号"],
  ["today", "今天"],
  ["3", "3 天内"],
  ["7", "7 天内"],
  ["15", "15 天内"],
  ["30", "30 天内"],
] as const;

const groupName = (days: number) =>
  days === 0
    ? "今天续费"
    : days <= 3
      ? "1-3 天内续费"
      : days <= 7
        ? "4-7 天内续费"
        : days <= 15
          ? "8-15 天内续费"
          : days <= 30
            ? "16-30 天内续费"
            : "30 天后续费";

const urgency = (days: number) => {
  if (days === 0) return { text: "今天", tone: "danger" as const };
  if (days <= 3) return { text: `${days} 天内`, tone: "urgent" as const };
  if (days <= 7) return { text: `${days} 天内`, tone: "warning" as const };
  if (days <= 30) return { text: `${days} 天`, tone: "notice" as const };
  return { text: `${days} 天`, tone: "success" as const };
};

const accountStatus = {
  ACTIVE: { text: "正常", tone: "success" as const },
  PAUSED: { text: "暂停", tone: "neutral" as const },
  ABNORMAL: { text: "异常", tone: "danger" as const },
  EXITED: { text: "已停用", tone: "neutral" as const },
};

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const requestedRange = (await searchParams).range || "all";
  const range = tabs.some(([value]) => value === requestedRange) ? requestedRange : "all";
  const today = databaseToday();
  const slots = (await prisma.parkingSlot.findMany({ include: { platform: true } }))
    .map((slot) => {
      const nextBillingDate = nextMonthlyBillingDate(slot.billingDay, today);
      return { ...slot, nextBillingDate, days: dayDiff(nextBillingDate, today) };
    })
    .toSorted((a, b) => a.days - b.days || a.platform.name.localeCompare(b.platform.name, "zh-CN") || a.slotNumber - b.slotNumber);

  const match = (days: number, value: string) =>
    value === "all" || (value === "today" ? days === 0 : days <= Number(value));
  const visibleSlots = slots.filter((slot) => match(slot.days, range));
  const tabCount = (value: string) => slots.filter((slot) => match(slot.days, value)).length;
  const grouped = visibleSlots.reduce<Map<string, typeof visibleSlots>>((result, slot) => {
    const key = groupName(slot.days);
    result.set(key, [...(result.get(key) || []), slot]);
    return result;
  }, new Map());
  const dueSoon = slots.filter((slot) => slot.days <= 7).length;

  return (
    <div className="mx-auto max-w-[1700px] space-y-4">
      <PageHeader title="订阅续费" description="按每个合租账号的平台续费日查看下一次扣费时间" />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tabs.map(([value, label]) => (
          <Link
            key={value}
            href={`/reminders?range=${value}`}
            aria-current={range === value ? "page" : undefined}
            className={cn("panel flex min-h-[88px] items-center gap-3 p-4 transition", range === value && "ring-2 ring-[var(--primary)]")}
          >
            <span className={`metric-icon ${value === "today" || value === "3" ? "icon-tone-orange" : "icon-tone-blue"}`}>
              <Clock3 size={20} />
            </span>
            <span>
              <span className="block text-[12px] text-[var(--muted-foreground)]">{label}</span>
              <strong className="mt-1 block text-[22px] tabular">{tabCount(value)}</strong>
            </span>
          </Link>
        ))}
      </section>
      {slots.length > 0 && (
        <section className="panel flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="metric-icon icon-tone-orange"><CircleDollarSign size={20} /></span>
            <div>
              <strong className="block text-[14px]">未来 7 天有 {dueSoon} 个账号到续费日</strong>
              <p className="mt-1 text-[12px] text-[var(--muted-foreground)]">续费日期来自每个合租账号设置的“每月续费日”</p>
            </div>
          </div>
          <Link href="/slots" className="btn">管理合租账号</Link>
        </section>
      )}
      <section className="panel overflow-hidden">
        <div className="data-wrap responsive-table-desktop">
          <table className="data-table">
            <thead>
              <tr>
                <th>合租账号</th>
                <th>平台</th>
                <th>平台续费日</th>
                <th>下次续费</th>
                <th>剩余时间</th>
                <th>卡尾号</th>
                <th>账号状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {[...grouped.entries()].map(([group, groupSlots]) => (
                <Fragment key={group}>
                  <tr className="bg-[var(--surface-subtle)]">
                    <td colSpan={8}>
                      <span className="flex items-center gap-2 font-semibold">
                        <CalendarClock size={15} className="text-[var(--warning)]" />
                        {group}
                        <span className="text-[var(--muted-foreground)]">({groupSlots.length})</span>
                      </span>
                    </td>
                  </tr>
                  {groupSlots.map((slot) => {
                    const timing = urgency(slot.days);
                    const status = accountStatus[slot.status];
                    const href = `/slots?platform=${slot.platform.slug}&open=${slot.id}`;
                    return (
                      <tr key={slot.id}>
                        <td>
                          <Link className="block min-w-[220px]" href={href}>
                            <strong className="block">#{slot.slotNumber}</strong>
                            <small className="block truncate text-[var(--accent)]">{slot.accountEmail}</small>
                          </Link>
                        </td>
                        <td>
                          <span className="flex items-center gap-2">
                            <PlatformIcon slug={slot.platform.slug} name={slot.platform.name} icon={slot.platform.icon} size={18} />
                            {slot.platform.name}
                          </span>
                        </td>
                        <td className="whitespace-nowrap tabular">每月 {slot.billingDay} 日</td>
                        <td className="whitespace-nowrap tabular">{format(slot.nextBillingDate, "yyyy.MM.dd")}</td>
                        <td><Badge tone={timing.tone}>{timing.text}</Badge></td>
                        <td className="tabular">{slot.cardLast4 || "-"}</td>
                        <td><Badge tone={status.tone}>{status.text}</Badge></td>
                        <td><Link className="btn min-h-8 px-3 text-[12px]" href={href}>管理账号</Link></td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
          {!visibleSlots.length && <div className="empty">当前筛选范围内没有账号续费记录</div>}
        </div>
        <div className="mobile-record-list">
          {[...grouped.entries()].map(([group, groupSlots]) => (
            <section key={group}>
              <h2 className="mb-2 mt-3 flex items-center gap-2 px-3 text-[13px] font-semibold">
                <CalendarClock size={15} className="text-[var(--warning)]" />{group} ({groupSlots.length})
              </h2>
              {groupSlots.map((slot) => {
                const timing = urgency(slot.days);
                const status = accountStatus[slot.status];
                const href = `/slots?platform=${slot.platform.slug}&open=${slot.id}`;
                return (
                  <article className="mobile-record" key={slot.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <strong>{slot.platform.name} #{slot.slotNumber}</strong>
                        <div className="mt-1 flex items-center gap-2 text-[12px] text-[var(--muted-foreground)]">
                          <PlatformIcon slug={slot.platform.slug} name={slot.platform.name} icon={slot.platform.icon} size={15} />
                          <span className="truncate">{slot.accountEmail}</span>
                        </div>
                      </div>
                      <Badge tone={timing.tone}>{timing.text}</Badge>
                    </div>
                    <dl className="mt-3 grid grid-cols-[76px_minmax(0,1fr)] gap-y-2 text-[12px]">
                      <dt className="mobile-record-label">平台续费日</dt><dd className="tabular">每月 {slot.billingDay} 日</dd>
                      <dt className="mobile-record-label">下次续费</dt><dd className="tabular">{format(slot.nextBillingDate, "yyyy.MM.dd")}</dd>
                      <dt className="mobile-record-label">卡尾号</dt><dd className="tabular">{slot.cardLast4 || "-"}</dd>
                      <dt className="mobile-record-label">账号状态</dt><dd><Badge tone={status.tone}>{status.text}</Badge></dd>
                    </dl>
                    <div className="mt-3 border-t border-[var(--border)] pt-3">
                      <Link className="btn min-h-9 w-full text-[12px]" href={href}>管理账号</Link>
                    </div>
                  </article>
                );
              })}
            </section>
          ))}
          {!visibleSlots.length && <div className="empty">当前筛选范围内没有账号续费记录</div>}
        </div>
      </section>
    </div>
  );
}
