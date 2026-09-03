import { addDays, format, startOfMonth } from "date-fns";
import { AlertTriangle, Clock3, UserRoundCheck, UserRoundPlus, Search, X, Plus } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { ContactValue } from "@/components/contact-method";
import { CsvExport } from "@/components/csv-export";
import { Pagination } from "@/components/pagination";
import { PlatformIcon } from "@/components/platform-icon";
import { RenewButton } from "@/components/renew-button";
import type { MemberItem } from "@/components/slot-manager";
import { Badge, MetricCard, PageHeader } from "@/components/ui";
import { databaseToday, expiryLabel } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "车友管理" };

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; platform?: string; status?: string; expiry?: string; page?: string; size?: string }> }) {
  const { q = "", platform = "", status = "", expiry = "", page: pageParam = "1", size = "20" } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1); const pageSize = [10, 20, 50, 100].includes(Number(size)) ? Number(size) : 20;
  const today = databaseToday();
  const expiryWhere = !expiry ? {} : expiry === "expired" ? { lt: today } : { gte: today, lte: addDays(today, Number(expiry)) };
  const where: Prisma.MemberWhereInput = {
    ...(q ? { OR: [{ nickname: { contains: q, mode: "insensitive" as const } }, { contact: { contains: q, mode: "insensitive" as const } }, { slot: { accountEmail: { contains: q, mode: "insensitive" as const } } }] } : {}),
    ...(platform ? { slot: { platform: { slug: platform } } } : {}),
    ...(status === "ACTIVE" || status === "EXITED" ? { status: status as "ACTIVE" | "EXITED" } : {}),
    ...(expiry ? { expireDate: expiryWhere } : {}),
  };
  const [platforms, members, exportMembers, matched, active, upcoming, expired, addedThisMonth] = await Promise.all([
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
    prisma.member.findMany({ where, include: { slot: { include: { platform: true } }, renewals: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.member.findMany({ where, include: { slot: { include: { platform: true } } }, orderBy: { updatedAt: "desc" }, take: 5000 }),
    prisma.member.count({ where }),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.member.count({ where: { status: "ACTIVE", expireDate: { gte: today, lte: addDays(today, 30) } } }),
    prisma.member.count({ where: { status: "ACTIVE", expireDate: { lt: today } } }),
    prisma.member.count({ where: { createdAt: { gte: startOfMonth(today), lt: addDays(today, 1) } } }),
  ]);
  const filtered = Boolean(q || platform || status || expiry);

  return <div className="mx-auto max-w-[1800px] space-y-4">
    <PageHeader title="车友管理" description="统一管理所有平台的车友与订阅状态" actions={<div className="flex gap-2"><CsvExport filename={`车友-${format(today, "yyyyMMdd")}.csv`} rows={exportMembers.map((member) => ({ nickname: member.nickname, contactType: member.contactType, contact: member.contact, platform: member.slot.platform.name, account: member.slot.accountEmail, startDate: format(member.startDate, "yyyy-MM-dd"), expireDate: format(member.expireDate, "yyyy-MM-dd"), status: member.status === "ACTIVE" ? "在位" : "已退出" }))} labels={{ nickname: "昵称", contactType: "联系方式类型", contact: "联系方式", platform: "平台", account: "登录账号", startDate: "开始日期", expireDate: "到期日期", status: "状态" }} /><Link className="btn btn-primary" href="/slots"><Plus size={16} />新增车友</Link></div>} />
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><MetricCard label="在位车友" value={active} icon={<UserRoundCheck size={22} />} tone="green" detail="当前正常订阅" /><MetricCard label="30 天内到期" value={upcoming} icon={<Clock3 size={22} />} tone="orange" detail="需要提前跟进" /><MetricCard label="已过期" value={expired} icon={<AlertTriangle size={22} />} tone="red" detail="仍在位且已到期" /><MetricCard label="本月新增" value={addedThisMonth} icon={<UserRoundPlus size={22} />} tone="blue" detail="本月加入车友" /></section>
    <section className="panel overflow-hidden">
      <form className="toolbar border-b border-[var(--border)] px-4 py-3"><div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-[6px] border border-[var(--border-strong)] px-3"><Search size={15} className="text-[#7b8493]" /><input aria-label="搜索昵称、联系方式或登录账号" name="q" defaultValue={q} className="h-9 min-w-0 flex-1 outline-none" placeholder="搜索昵称、联系方式、登录账号" /></div><select aria-label="平台" className="select w-auto min-w-[130px]" name="platform" defaultValue={platform}><option value="">全部平台</option>{platforms.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select><select aria-label="成员状态" className="select w-auto min-w-[120px]" name="status" defaultValue={status}><option value="">全部状态</option><option value="ACTIVE">在位</option><option value="EXITED">已退出</option></select><select aria-label="到期范围" className="select w-auto min-w-[130px]" name="expiry" defaultValue={expiry}><option value="">全部到期范围</option><option value="7">7 天内</option><option value="30">30 天内</option><option value="expired">已过期</option></select><button className="btn" type="submit">筛选</button>{filtered && <Link className="btn icon-btn" href="/members" aria-label="重置筛选" title="重置筛选"><X size={15} /></Link>}</form>
      <div className="data-wrap responsive-table-desktop"><table className="data-table"><thead><tr><th>车友</th><th>联系方式</th><th>平台</th><th>账号编号</th><th>登录账号</th><th>开始日期</th><th>到期日期</th><th>状态</th><th>最近续费</th><th>操作</th></tr></thead><tbody>{members.map((member) => {
        const expiryInfo = expiryLabel(member.expireDate, today);
        const item: MemberItem = { id: member.id, nickname: member.nickname, contact: member.contact, contactType: member.contactType, startDate: member.startDate.toISOString(), expireDate: member.expireDate.toISOString(), status: member.status, note: member.note };
        return <tr key={member.id}><td><span className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-[#edf3ff] text-[11px] font-semibold text-[#2457bd]">{member.nickname.slice(0, 1).toUpperCase()}</span><strong>{member.nickname}</strong></span></td><td><ContactValue type={member.contactType} value={member.contact} /></td><td><span className="flex items-center gap-2"><PlatformIcon slug={member.slot.platform.slug} name={member.slot.platform.name} icon={member.slot.platform.icon} size={15} />{member.slot.platform.name}</span></td><td><Link className="text-[#2457bd]" href={`/slots?platform=${member.slot.platform.slug}&open=${member.slotId}`}>#{member.slot.slotNumber}</Link></td><td className="text-[#2457bd]">{member.slot.accountEmail}</td><td className="tabular">{format(member.startDate, "yyyy.MM.dd")}</td><td className="tabular">{format(member.expireDate, "yyyy.MM.dd")}</td><td>{member.status === "EXITED" ? <Badge tone="neutral">已退出</Badge> : <Badge tone={expiryInfo.tone}>{expiryInfo.text}</Badge>}</td><td>{member.renewals[0] ? format(member.renewals[0].createdAt, "yyyy.MM.dd") : "-"}</td><td><div className="flex gap-1"><Link className="btn min-h-8 px-2 text-[12px]" href={`/slots?platform=${member.slot.platform.slug}&open=${member.slotId}`}>查看</Link>{member.status === "ACTIVE" && <RenewButton member={item} compact />}</div></td></tr>;
      })}</tbody></table>{!members.length && <div className="empty">没有符合条件的车友</div>}</div>
      <div className="mobile-record-list">{members.map((member) => { const expiryInfo = expiryLabel(member.expireDate, today); const item: MemberItem = { id: member.id, nickname: member.nickname, contact: member.contact, contactType: member.contactType, startDate: member.startDate.toISOString(), expireDate: member.expireDate.toISOString(), status: member.status, note: member.note }; return <article className="mobile-record" key={member.id}><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#edf3ff] text-[12px] font-semibold text-[#2457bd]">{member.nickname.slice(0, 1).toUpperCase()}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><strong className="truncate">{member.nickname}</strong>{member.status === "EXITED" ? <Badge tone="neutral">已退出</Badge> : <Badge tone={expiryInfo.tone}>{expiryInfo.text}</Badge>}</div><div className="mt-1 flex items-center gap-2 text-[12px] text-[var(--muted-foreground)]"><PlatformIcon slug={member.slot.platform.slug} name={member.slot.platform.name} icon={member.slot.platform.icon} size={15} /><span>{member.slot.platform.name} #{member.slot.slotNumber}</span></div></div></div><dl className="mt-3 grid grid-cols-[76px_minmax(0,1fr)] gap-y-2 text-[12px]"><dt className="mobile-record-label">联系方式</dt><dd><ContactValue type={member.contactType} value={member.contact} /></dd><dt className="mobile-record-label">登录账号</dt><dd className="truncate text-[#2457bd]">{member.slot.accountEmail}</dd><dt className="mobile-record-label">订阅周期</dt><dd className="tabular">{format(member.startDate, "yyyy.MM.dd")} - {format(member.expireDate, "yyyy.MM.dd")}</dd></dl><div className="mt-3 flex gap-2 border-t border-[var(--border)] pt-3"><Link className="btn min-h-9 flex-1 text-[12px]" href={`/slots?platform=${member.slot.platform.slug}&open=${member.slotId}`}>查看账号</Link>{member.status === "ACTIVE" && <RenewButton member={item} compact />}</div></article>; })}{!members.length && <div className="empty">没有符合条件的车友</div>}</div>
      <Pagination page={page} total={matched} pageSize={pageSize} pathname="/members" params={{ q, platform, status, expiry }} pageSizes={[10, 20, 50, 100]} />
    </section>
  </div>;
}
