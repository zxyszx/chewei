import { format, isSameDay } from "date-fns";
import { AlertTriangle, Clock3, UserRoundCheck, UsersRound, UserRoundPlus, Search, X } from "lucide-react";
import Link from "next/link";
import { ContactValue } from "@/components/contact-method";
import { PlatformIcon } from "@/components/platform-icon";
import { RenewButton } from "@/components/renew-button";
import type { MemberItem } from "@/components/slot-manager";
import { Badge, PageHeader } from "@/components/ui";
import { databaseToday, dayDiff, expiryLabel } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "车友管理" };

function MemberStat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof UsersRound; tone: string }) {
  return <div className="panel flex min-h-[86px] items-center gap-3 p-4"><span className={`grid size-9 place-items-center rounded-[7px] ${tone}`}><Icon size={18} /></span><div><p className="text-[11px] text-[var(--muted-foreground)]">{label}</p><strong className="mt-0.5 block text-[21px] tabular">{value}</strong></div></div>;
}

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; platform?: string; status?: string; expiry?: string }> }) {
  const { q = "", platform = "", status = "", expiry = "" } = await searchParams;
  const today = databaseToday();
  const [platforms, allMembers] = await Promise.all([
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
    prisma.member.findMany({ include: { slot: { include: { platform: true } }, renewals: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" } }),
  ]);
  const members = allMembers.filter((member) => {
    const text = `${member.nickname} ${member.contact} ${member.slot.accountEmail}`.toLowerCase();
    const days = dayDiff(member.expireDate, today);
    const expiryMatch = !expiry || (expiry === "expired" ? days < 0 : days >= 0 && days <= Number(expiry));
    return (!q || text.includes(q.toLowerCase())) && (!platform || member.slot.platform.slug === platform) && (!status || member.status === status) && expiryMatch;
  });
  const active = allMembers.filter((member) => member.status === "ACTIVE").length;
  const upcoming = allMembers.filter((member) => member.status === "ACTIVE" && dayDiff(member.expireDate, today) >= 0 && dayDiff(member.expireDate, today) <= 30).length;
  const expired = allMembers.filter((member) => member.status === "ACTIVE" && dayDiff(member.expireDate, today) < 0).length;
  const addedToday = allMembers.filter((member) => isSameDay(member.createdAt, new Date())).length;
  const filtered = Boolean(q || platform || status || expiry);

  return <div className="mx-auto max-w-[1800px] space-y-4">
    <PageHeader title="车友管理" description="统一管理所有平台的车友成员与订阅状态" />
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"><MemberStat label="车友总数" value={allMembers.length} icon={UsersRound} tone="bg-[#eef4ff] text-[#2563eb]" /><MemberStat label="活跃车友" value={active} icon={UserRoundCheck} tone="bg-[#eaf8f1] text-[#087a55]" /><MemberStat label="30 天内到期" value={upcoming} icon={Clock3} tone="bg-[#fff5e8] text-[#b45309]" /><MemberStat label="已过期" value={expired} icon={AlertTriangle} tone="bg-[#fff0f0] text-[#c93636]" /><MemberStat label="今日新增" value={addedToday} icon={UserRoundPlus} tone="bg-[#f0f4ff] text-[#2457bd]" /></section>
    <section className="panel overflow-hidden">
      <form className="toolbar border-b border-[var(--border)] px-4 py-3"><div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-[6px] border border-[var(--border-strong)] px-3"><Search size={15} className="text-[#7b8493]" /><input aria-label="搜索昵称、联系方式或登录账号" name="q" defaultValue={q} className="h-9 min-w-0 flex-1 outline-none" placeholder="搜索昵称、联系方式、登录账号" /></div><select aria-label="平台" className="select w-auto min-w-[130px]" name="platform" defaultValue={platform}><option value="">全部平台</option>{platforms.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select><select aria-label="成员状态" className="select w-auto min-w-[120px]" name="status" defaultValue={status}><option value="">全部状态</option><option value="ACTIVE">在位</option><option value="EXITED">已退出</option></select><select aria-label="到期范围" className="select w-auto min-w-[130px]" name="expiry" defaultValue={expiry}><option value="">全部到期范围</option><option value="7">7 天内</option><option value="30">30 天内</option><option value="expired">已过期</option></select><button className="btn" type="submit">筛选</button>{filtered && <Link className="btn icon-btn" href="/members" aria-label="重置筛选" title="重置筛选"><X size={15} /></Link>}</form>
      <div className="data-wrap"><table className="data-table"><thead><tr><th>车友</th><th>联系方式</th><th>平台</th><th>账号编号</th><th>登录账号</th><th>开始日期</th><th>到期日期</th><th>状态</th><th>最近续费</th><th>操作</th></tr></thead><tbody>{members.map((member) => {
        const expiryInfo = expiryLabel(member.expireDate, today);
        const item: MemberItem = { id: member.id, nickname: member.nickname, contact: member.contact, contactType: member.contactType, startDate: member.startDate.toISOString(), expireDate: member.expireDate.toISOString(), status: member.status, note: member.note };
        return <tr key={member.id}><td><span className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-[#edf3ff] text-[11px] font-semibold text-[#2457bd]">{member.nickname.slice(0, 1).toUpperCase()}</span><strong>{member.nickname}</strong></span></td><td><ContactValue type={member.contactType} value={member.contact} /></td><td><span className="flex items-center gap-2"><PlatformIcon slug={member.slot.platform.slug} name={member.slot.platform.name} icon={member.slot.platform.icon} size={15} />{member.slot.platform.name}</span></td><td><Link className="text-[#2457bd]" href={`/slots?platform=${member.slot.platform.slug}&open=${member.slotId}`}>#{member.slot.slotNumber}</Link></td><td className="text-[#2457bd]">{member.slot.accountEmail}</td><td className="tabular">{format(member.startDate, "yyyy.MM.dd")}</td><td className="tabular">{format(member.expireDate, "yyyy.MM.dd")}</td><td>{member.status === "EXITED" ? <Badge tone="neutral">已退出</Badge> : <Badge tone={expiryInfo.tone}>{expiryInfo.text}</Badge>}</td><td>{member.renewals[0] ? format(member.renewals[0].createdAt, "yyyy.MM.dd") : "-"}</td><td><div className="flex gap-1"><Link className="btn min-h-8 px-2 text-[12px]" href={`/slots?platform=${member.slot.platform.slug}&open=${member.slotId}`}>查看</Link>{member.status === "ACTIVE" && <RenewButton member={item} compact />}</div></td></tr>;
      })}</tbody></table>{!members.length && <div className="empty">没有符合条件的车友</div>}</div>
    </section>
  </div>;
}
