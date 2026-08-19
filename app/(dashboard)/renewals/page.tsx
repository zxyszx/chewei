import { format } from "date-fns";
import { Download, Search } from "lucide-react";
import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "续费记录" };
const payment: Record<string, string> = { WECHAT: "微信", ALIPAY: "支付宝", CARD: "信用卡", CASH: "现金", OTHER: "其他" };

export default async function RenewalsPage({ searchParams }: { searchParams: Promise<{ q?: string; platform?: string; payment?: string }> }) {
  const { q = "", platform = "", payment: method = "" } = await searchParams;
  const [platforms, renewals] = await Promise.all([
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
    prisma.renewal.findMany({ where: { ...(q ? { OR: [{ member: { nickname: { contains: q, mode: "insensitive" } } }, { member: { contact: { contains: q, mode: "insensitive" } } }] } : {}), ...(platform ? { slot: { platform: { slug: platform } } } : {}), ...(method ? { paymentMethod: method as "WECHAT" } : {}) }, include: { member: true, slot: { include: { platform: true } }, operator: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return <div className="mx-auto max-w-[1800px] space-y-4"><PageHeader title="续费记录" description="每次续费独立留档，不覆盖历史" actions={<a href="/api/export/renewals" className="btn"><Download size={15} />导出 Excel</a>} />
    <section className="panel overflow-hidden"><form className="toolbar border-b border-[var(--border)] px-4 py-3"><div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-[6px] border border-[var(--border-strong)] px-3"><Search size={15} className="text-[#7b8493]" /><input name="q" defaultValue={q} className="h-9 min-w-0 flex-1 outline-none" placeholder="搜索车友或联系方式" /></div><select className="select w-auto" name="platform" defaultValue={platform}><option value="">全部平台</option>{platforms.map((p) => <option key={p.id} value={p.slug}>{p.name}</option>)}</select><select className="select w-auto" name="payment" defaultValue={method}><option value="">全部付款方式</option>{Object.entries(payment).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="btn">筛选</button></form><div className="data-wrap"><table className="data-table"><thead><tr><th>日期</th><th>车友</th><th>平台</th><th>车位</th><th>原到期时间</th><th>新到期时间</th><th>金额</th><th>支付方式</th><th>操作人</th><th>备注</th></tr></thead><tbody>{renewals.map((record) => <tr key={record.id}><td className="tabular">{format(record.createdAt, "yyyy.MM.dd HH:mm")}</td><td className="font-semibold">{record.member.nickname}</td><td>{record.slot.platform.name}</td><td><Link className="text-[#2457bd]" href={`/slots?open=${record.slotId}`}>#{record.slot.slotNumber}</Link></td><td className="tabular">{format(record.oldExpireDate, "yyyy.MM.dd")}</td><td className="tabular">{format(record.newExpireDate, "yyyy.MM.dd")}</td><td className="font-semibold tabular">¥ {record.amount.toFixed(2)}</td><td><Badge tone="neutral">{payment[record.paymentMethod]}</Badge></td><td>{record.operator.username}</td><td className="max-w-[180px] truncate text-[var(--muted-foreground)]">{record.note || "-"}</td></tr>)}</tbody></table>{!renewals.length && <div className="empty">暂无续费记录</div>}</div></section>
  </div>;
}
