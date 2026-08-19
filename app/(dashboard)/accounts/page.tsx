import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { PasswordCell } from "@/components/password-cell";
import { Badge, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "账号管理" };

export default async function AccountsPage() {
  const slots = await prisma.parkingSlot.findMany({ include: { platform: true }, orderBy: [{ platform: { name: "asc" } }, { slotNumber: "asc" }] });
  return <div className="mx-auto max-w-[1700px] space-y-4"><PageHeader title="账号管理" description="密码默认隐藏，查看行为会写入操作日志" />
    <section className="panel overflow-hidden"><div className="data-wrap"><table className="data-table"><thead><tr><th>平台</th><th>Gmail</th><th>密码</th><th>信用卡尾号</th><th>续费日期</th><th>当前车位</th><th>状态</th><th>备注</th><th>操作</th></tr></thead><tbody>{slots.map((slot) => <tr key={slot.id}><td>{slot.platform.name}</td><td className="font-medium text-[#2457bd]">{slot.accountEmail}</td><td><PasswordCell slotId={slot.id} /></td><td>{slot.cardLast4 ? `•••• ${slot.cardLast4}` : "-"}</td><td>每月 {slot.billingDay} 日</td><td>#{slot.slotNumber}</td><td><Badge tone={slot.status === "ACTIVE" ? "success" : "danger"}>{slot.status === "ACTIVE" ? "正常" : slot.status === "PAUSED" ? "暂停" : "异常"}</Badge></td><td className="max-w-[180px] truncate text-[var(--muted-foreground)]">{slot.note || "-"}</td><td><Link href={`/slots?open=${slot.id}`} className="btn min-h-8 px-2 text-[12px]">详情<ExternalLink size={13} /></Link></td></tr>)}</tbody></table></div></section>
  </div>;
}
