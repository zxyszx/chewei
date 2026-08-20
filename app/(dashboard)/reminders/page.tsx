import { format } from "date-fns";
import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import { RenewButton } from "@/components/renew-button";
import type { MemberItem } from "@/components/slot-manager";
import { Badge, PageHeader } from "@/components/ui";
import { databaseToday, dayDiff, expiryLabel } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "到期提醒" };
const tabs = [["all", "全部"], ["today", "今天"], ["3", "3 天内"], ["7", "7 天内"], ["30", "30 天内"], ["expired", "已过期"]] as const;

export default async function RemindersPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const range = (await searchParams).range || "all";
  const now = databaseToday();
  const allMembers = await prisma.member.findMany({ where: { status: "ACTIVE" }, include: { slot: { include: { platform: true } } }, orderBy: { expireDate: "asc" } });
  const match = (days: number, value: string) => value === "all" || (value === "expired" ? days < 0 : value === "today" ? days === 0 : days >= 0 && days <= Number(value));
  const members = allMembers.filter((member) => match(dayDiff(member.expireDate, now), range));
  const tabCount = (value: string) => allMembers.filter((member) => match(dayDiff(member.expireDate, now), value)).length;

  return <div className="mx-auto max-w-[1700px] space-y-4">
    <PageHeader title="到期提醒" description="到期状态根据车友日期自动计算" />
    <section className="panel overflow-hidden">
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)] px-3 py-2">
        {tabs.map(([value, label]) => <Link key={value} href={`/reminders?range=${value}`} className={cn("flex min-h-9 items-center gap-2 whitespace-nowrap rounded-[5px] px-3 py-2 text-[12px] font-medium text-[#657080] hover:bg-[#f3f5f7]", range === value && "bg-[#edf3ff] text-[#2457bd]")}>{label}<span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] tabular text-[#667085]">{tabCount(value)}</span></Link>)}
      </div>
      <div className="data-wrap"><table className="data-table"><thead><tr><th>车友</th><th>平台</th><th>车位</th><th>联系方式</th><th>到期时间</th><th>剩余时间</th><th>状态</th><th>操作</th></tr></thead><tbody>
        {members.map((member) => {
          const expiry = expiryLabel(member.expireDate, now);
          const item: MemberItem = { id: member.id, nickname: member.nickname, contact: member.contact, startDate: member.startDate.toISOString(), expireDate: member.expireDate.toISOString(), status: member.status, note: member.note };
          return <tr key={member.id}><td className="font-semibold">{member.nickname}</td><td><span className="flex items-center gap-2"><PlatformIcon slug={member.slot.platform.slug} name={member.slot.platform.name} icon={member.slot.platform.icon} size={15} />{member.slot.platform.name}</span></td><td><Link className="text-[#2457bd]" href={`/slots?open=${member.slotId}`}>#{member.slot.slotNumber}</Link></td><td>{member.contact}</td><td className="tabular">{format(member.expireDate, "yyyy.MM.dd")}</td><td><Badge tone={expiry.tone}>{expiry.text}</Badge></td><td>{expiry.days < 0 ? <Badge tone="danger">已过期</Badge> : expiry.days <= 7 ? <Badge tone="warning">需关注</Badge> : <Badge tone="success">正常</Badge>}</td><td><RenewButton member={item} compact /></td></tr>;
        })}
      </tbody></table>{!members.length && <div className="empty">当前筛选范围内没有到期记录</div>}</div>
    </section>
  </div>;
}
