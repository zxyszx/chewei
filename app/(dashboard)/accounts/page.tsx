import { ExternalLink, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { PasswordCell } from "@/components/password-cell";
import { PlatformIcon } from "@/components/platform-icon";
import { Badge, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "账号管理" };

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ q?: string; platform?: string; status?: string }> }) {
  const { q = "", platform = "", status = "" } = await searchParams;
  const [platforms, slots] = await Promise.all([
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
    prisma.parkingSlot.findMany({ where: { ...(q ? { OR: [{ accountEmail: { contains: q, mode: "insensitive" } }, { note: { contains: q, mode: "insensitive" } }] } : {}), ...(platform ? { platform: { slug: platform } } : {}), ...(["ACTIVE", "PAUSED", "ABNORMAL"].includes(status) ? { status: status as "ACTIVE" | "PAUSED" | "ABNORMAL" } : {}) }, include: { platform: true }, orderBy: [{ platform: { name: "asc" } }, { slotNumber: "asc" }] }),
  ]);
  const filtered = Boolean(q || platform || status);
  return <div className="mx-auto max-w-[1700px] space-y-4">
    <PageHeader title="账号管理" description="密码默认隐藏，查看行为会写入操作日志" actions={<Link href="/slots?create=1" className="btn btn-primary"><Plus size={16} />新增账号</Link>} />
    <section className="panel overflow-hidden">
      <form className="toolbar border-b border-[var(--border)] px-4 py-3"><div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-[6px] border border-[var(--border-strong)] px-3"><Search size={15} className="text-[#7b8493]" /><input aria-label="搜索平台、账号或备注" name="q" defaultValue={q} className="h-9 min-w-0 flex-1 outline-none" placeholder="搜索平台、账号、备注" /></div><select aria-label="平台" className="select w-auto min-w-[140px]" name="platform" defaultValue={platform}><option value="">全部平台</option>{platforms.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select><select aria-label="状态" className="select w-auto min-w-[120px]" name="status" defaultValue={status}><option value="">全部状态</option><option value="ACTIVE">正常</option><option value="PAUSED">暂停</option><option value="ABNORMAL">异常</option></select><button className="btn" type="submit">筛选</button>{filtered && <Link className="btn icon-btn" href="/accounts" aria-label="重置筛选" title="重置筛选"><X size={15} /></Link>}</form>
      <div className="data-wrap"><table className="data-table"><thead><tr><th>平台</th><th>Gmail</th><th>密码</th><th>信用卡尾号</th><th>续费日期</th><th>当前车位</th><th>状态</th><th>备注</th><th>操作</th></tr></thead><tbody>{slots.map((slot) => <tr key={slot.id}><td><span className="flex items-center gap-2"><PlatformIcon slug={slot.platform.slug} name={slot.platform.name} icon={slot.platform.icon} size={15} />{slot.platform.name}</span></td><td className="font-medium text-[#2457bd]">{slot.accountEmail}</td><td><PasswordCell slotId={slot.id} /></td><td>{slot.cardLast4 ? `•••• ${slot.cardLast4}` : "-"}</td><td>每月 {slot.billingDay} 日</td><td>#{slot.slotNumber}</td><td><Badge tone={slot.status === "ACTIVE" ? "success" : slot.status === "PAUSED" ? "neutral" : "danger"}>{slot.status === "ACTIVE" ? "正常" : slot.status === "PAUSED" ? "暂停" : "异常"}</Badge></td><td className="max-w-[180px] truncate text-[var(--muted-foreground)]">{slot.note || "-"}</td><td><Link href={`/slots?platform=${slot.platform.slug}&open=${slot.id}`} className="btn min-h-8 px-2 text-[12px]">详情<ExternalLink size={13} /></Link></td></tr>)}</tbody></table>{!slots.length && <div className="empty">没有符合条件的账号</div>}</div>
    </section>
  </div>;
}
