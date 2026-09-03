import { format } from "date-fns";
import { AlertTriangle, CalendarClock, Clock3, PhoneCall } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { ContactValue } from "@/components/contact-method";
import { PlatformIcon } from "@/components/platform-icon";
import { RenewButton } from "@/components/renew-button";
import type { MemberItem } from "@/components/slot-manager";
import { Badge, PageHeader } from "@/components/ui";
import { databaseToday, dayDiff, expiryLabel } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "到期提醒" };
const tabs = [
  ["all", "全部"],
  ["today", "今天"],
  ["3", "3 天内"],
  ["7", "7 天内"],
  ["30", "30 天内"],
  ["expired", "已过期"],
] as const;

const groupName = (days: number) => days < 0 ? "已过期" : days === 0 ? "今天到期" : days <= 3 ? "1-3 天内到期" : days <= 7 ? "4-7 天内到期" : days <= 15 ? "8-15 天内到期" : "16-30 天内到期";

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const range = (await searchParams).range || "all";
  const now = databaseToday();
  const allMembers = await prisma.member.findMany({
    where: { status: "ACTIVE" },
    include: { slot: { include: { platform: true } } },
    orderBy: { expireDate: "asc" },
  });
  const match = (days: number, value: string) =>
    value === "all" ||
    (value === "expired"
      ? days < 0
      : value === "today"
        ? days === 0
        : days >= 0 && days <= Number(value));
  const members = allMembers.filter((member) =>
    match(dayDiff(member.expireDate, now), range),
  );
  const tabCount = (value: string) =>
    allMembers.filter((member) => match(dayDiff(member.expireDate, now), value))
      .length;
  const grouped = members.reduce<Map<string, typeof members>>((result, member) => {
    const key = groupName(dayDiff(member.expireDate, now));
    result.set(key, [...(result.get(key) || []), member]);
    return result;
  }, new Map());

  return (
    <div className="mx-auto max-w-[1700px] space-y-4">
      <PageHeader title="到期提醒" description="按时间优先级处理即将到期的车友" />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{tabs.map(([value, label], index) => <Link key={value} href={`/reminders?range=${value}`} className={cn("panel flex min-h-[88px] items-center gap-3 p-4 transition", range === value && "ring-2 ring-[var(--primary)]")}><span className={`metric-icon ${value === "expired" ? "icon-tone-red" : index < 2 ? "icon-tone-orange" : "icon-tone-blue"}`}>{value === "expired" ? <AlertTriangle size={20} /> : <Clock3 size={20} />}</span><span><span className="block text-[12px] text-[var(--muted-foreground)]">{label}</span><strong className="mt-1 block text-[22px] tabular">{tabCount(value)}</strong></span></Link>)}</section>
      {members.length > 0 && <section className="panel flex flex-wrap items-center justify-between gap-3 p-4"><div className="flex items-center gap-3"><span className="metric-icon icon-tone-orange"><PhoneCall size={20} /></span><div><strong className="block text-[14px]">建议优先联系 {members.filter((member) => dayDiff(member.expireDate, now) <= 7).length} 位车友</strong><p className="mt-1 text-[12px] text-[var(--muted-foreground)]">优先处理已过期和 7 天内到期记录</p></div></div><Link href="/renewals" className="btn">查看续费记录</Link></section>}
      <section className="panel overflow-hidden">
        <div className="data-wrap responsive-table-desktop">
          <table className="data-table">
            <thead>
              <tr>
                <th>车友</th>
                <th>平台</th>
                <th>合租车位</th>
                <th>联系方式</th>
                <th>到期时间</th>
                <th>剩余时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {[...grouped.entries()].map(([group, groupMembers]) => <Fragment key={group}><tr className="bg-[var(--surface-subtle)]"><td colSpan={8}><span className="flex items-center gap-2 font-semibold"><CalendarClock size={15} className="text-[var(--warning)]" />{group}<span className="text-[var(--muted-foreground)]">({groupMembers.length})</span></span></td></tr>{groupMembers.map((member) => {
                const expiry = expiryLabel(member.expireDate, now);
                const item: MemberItem = {
                  id: member.id,
                  nickname: member.nickname,
                  contact: member.contact,
                  contactType: member.contactType,
                  startDate: member.startDate.toISOString(),
                  expireDate: member.expireDate.toISOString(),
                  status: member.status,
                  note: member.note,
                };
                return (
                  <tr key={member.id}>
                    <td className="font-semibold">{member.nickname}</td>
                    <td>
                      <span className="flex items-center gap-2">
                        <PlatformIcon
                          slug={member.slot.platform.slug}
                          name={member.slot.platform.name}
                          icon={member.slot.platform.icon}
                          size={15}
                        />
                        {member.slot.platform.name}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="text-[var(--accent)]"
                        href={`/slots?open=${member.slotId}`}
                      >
                        #{member.slot.slotNumber}
                      </Link>
                    </td>
                    <td><ContactValue type={member.contactType} value={member.contact} /></td>
                    <td className="tabular">
                      {format(member.expireDate, "yyyy.MM.dd")}
                    </td>
                    <td>
                      <Badge tone={expiry.tone}>{expiry.text}</Badge>
                    </td>
                    <td>
                      {expiry.days < 0 ? (
                        <Badge tone="danger">已过期</Badge>
                      ) : expiry.days <= 7 ? (
                        <Badge tone="warning">需关注</Badge>
                      ) : (
                        <Badge tone="success">正常</Badge>
                      )}
                    </td>
                    <td>
                      <RenewButton member={item} compact />
                    </td>
                  </tr>
                );
              })}</Fragment>)}
            </tbody>
          </table>
          {!members.length && (
            <div className="empty">当前筛选范围内没有到期记录</div>
          )}
        </div>
        <div className="mobile-record-list">{[...grouped.entries()].map(([group, groupMembers]) => <section key={group}><h2 className="mb-2 mt-3 flex items-center gap-2 text-[13px] font-semibold"><CalendarClock size={15} className="text-[var(--warning)]" />{group} ({groupMembers.length})</h2>{groupMembers.map((member) => { const expiry = expiryLabel(member.expireDate, now); const item: MemberItem = { id: member.id, nickname: member.nickname, contact: member.contact, contactType: member.contactType, startDate: member.startDate.toISOString(), expireDate: member.expireDate.toISOString(), status: member.status, note: member.note }; return <article className="mobile-record" key={member.id}><div className="flex items-start justify-between gap-3"><div><strong>{member.nickname}</strong><div className="mt-1 flex items-center gap-2 text-[12px] text-[var(--muted-foreground)]"><PlatformIcon slug={member.slot.platform.slug} name={member.slot.platform.name} icon={member.slot.platform.icon} size={15} />{member.slot.platform.name} #{member.slot.slotNumber}</div></div><Badge tone={expiry.tone}>{expiry.text}</Badge></div><dl className="mt-3 grid grid-cols-[76px_minmax(0,1fr)] gap-y-2 text-[12px]"><dt className="mobile-record-label">到期时间</dt><dd className="tabular">{format(member.expireDate, "yyyy.MM.dd")}</dd><dt className="mobile-record-label">联系方式</dt><dd><ContactValue type={member.contactType} value={member.contact} /></dd><dt className="mobile-record-label">处理状态</dt><dd>{expiry.days < 0 ? <Badge tone="danger">已过期</Badge> : expiry.days <= 7 ? <Badge tone="warning">需关注</Badge> : <Badge tone="success">正常</Badge>}</dd></dl><div className="mt-3 flex gap-2 border-t border-[var(--border)] pt-3"><Link className="btn min-h-9 flex-1 text-[12px]" href={`/slots?open=${member.slotId}`}>查看账号</Link><RenewButton member={item} compact /></div></article>; })}</section>)}{!members.length && <div className="empty">当前筛选范围内没有到期记录</div>}</div>
      </section>
    </div>
  );
}
