import { format } from "date-fns";
import { Search } from "lucide-react";
import Link from "next/link";
import { RenewButton } from "@/components/renew-button";
import type { MemberItem } from "@/components/slot-manager";
import { Badge, PageHeader } from "@/components/ui";
import { expiryLabel } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "车友管理" };

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; platform?: string }> }) {
  const { q = "", platform = "" } = await searchParams;
  const [platforms, members] = await Promise.all([
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
    prisma.member.findMany({
      where: { ...(platform ? { slot: { platform: { slug: platform } } } : {}), ...(q ? { OR: [{ nickname: { contains: q, mode: "insensitive" } }, { contact: { contains: q, mode: "insensitive" } }, { slot: { accountEmail: { contains: q, mode: "insensitive" } } }] } : {}) },
      include: { slot: { include: { platform: true } }, renewals: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" },
    }),
  ]);
  return <div className="mx-auto max-w-[1800px] space-y-4"><PageHeader title="车友管理" description={`统一管理所有平台的 ${members.length} 条车友记录`} />
    <section className="panel overflow-hidden"><form className="toolbar border-b border-[var(--border)] px-4 py-3"><div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-[6px] border border-[var(--border-strong)] px-3"><Search size={15} className="text-[#7b8493]" /><input name="q" defaultValue={q} className="h-9 min-w-0 flex-1 outline-none" placeholder="搜索昵称、联系方式、主账号" /></div><select className="select w-auto min-w-[140px]" name="platform" defaultValue={platform}><option value="">全部平台</option>{platforms.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select><button className="btn" type="submit">筛选</button></form>
      <div className="data-wrap"><table className="data-table"><thead><tr><th>车友</th><th>联系方式</th><th>平台</th><th>车位号</th><th>主账号</th><th>开始日期</th><th>到期日期</th><th>状态</th><th>最近续费</th><th>操作</th></tr></thead><tbody>{members.map((member) => { const expiry = expiryLabel(member.expireDate); const item: MemberItem = { id: member.id, nickname: member.nickname, contact: member.contact, startDate: member.startDate.toISOString(), expireDate: member.expireDate.toISOString(), status: member.status, note: member.note }; return <tr key={member.id}><td className="font-semibold">{member.nickname}</td><td>{member.contact}</td><td>{member.slot.platform.name}</td><td><Link className="text-[#2457bd]" href={`/slots?open=${member.slotId}`}>#{member.slot.slotNumber}</Link></td><td className="text-[#2457bd]">{member.slot.accountEmail}</td><td className="tabular">{format(member.startDate, "yyyy.MM.dd")}</td><td className="tabular">{format(member.expireDate, "yyyy.MM.dd")}</td><td>{member.status === "EXITED" ? <Badge tone="neutral">已退出</Badge> : <Badge tone={expiry.tone}>{expiry.text}</Badge>}</td><td>{member.renewals[0] ? format(member.renewals[0].createdAt, "yyyy.MM.dd") : "-"}</td><td>{member.status === "ACTIVE" ? <RenewButton member={item} compact /> : "-"}</td></tr>; })}</tbody></table>{!members.length && <div className="empty">没有符合条件的车友</div>}</div>
    </section>
  </div>;
}
