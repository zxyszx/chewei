import { addDays } from "date-fns";
import { AlertTriangle, ArrowRight, BellRing, CircleParking, CircleCheck, Clock3, UsersRound } from "lucide-react";
import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import { RenewButton } from "@/components/renew-button";
import type { MemberItem } from "@/components/slot-manager";
import { Badge, PageHeader } from "@/components/ui";
import { configuredReminderDays, databaseToday, expiryLabel, slotStatus } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "总览" };

function Stat({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof CircleParking; tone: string }) {
  return <div className="panel flex min-h-[104px] items-center gap-4 p-4"><div className={`grid size-10 shrink-0 place-items-center rounded-[8px] ${tone}`}><Icon size={20} /></div><div><p className="text-[12px] text-[var(--muted-foreground)]">{label}</p><strong className="mt-0.5 block text-[25px] font-semibold leading-8 tabular">{value}</strong><p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{detail}</p></div></div>;
}

export default async function OverviewPage() {
  const reminderSetting = await prisma.setting.findUnique({ where: { key: "reminderDays" } });
  const reminderCutoff = Math.max(...configuredReminderDays(reminderSetting?.value));
  const today = databaseToday();
  const [slots, members, reminders, upcoming, expired] = await Promise.all([
    prisma.parkingSlot.findMany({ include: { platform: true, members: { where: { status: "ACTIVE" }, orderBy: { expireDate: "asc" } } }, orderBy: { updatedAt: "desc" } }),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.member.findMany({ where: { status: "ACTIVE", expireDate: { lte: addDays(today, reminderCutoff) } }, include: { slot: { include: { platform: true } } }, orderBy: { expireDate: "asc" }, take: 8 }),
    prisma.member.count({ where: { status: "ACTIVE", expireDate: { gte: today, lte: addDays(today, reminderCutoff) } } }),
    prisma.member.count({ where: { status: "ACTIVE", expireDate: { lt: today } } }),
  ]);
  const full = slots.filter((slot) => slotStatus(slot.capacity, slot.members.length, slot.status) === "满").length;
  const open = slots.filter((slot) => slot.members.length < slot.capacity && slot.status === "ACTIVE").length;
  return <div className="mx-auto max-w-[1700px] space-y-4">
    <PageHeader title="总览" description={`当前共有 ${members} 位在位车友，数据更新于刚刚`} />
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-label="关键数据">
      <Stat label="车位总数" value={slots.length} detail="所有平台" icon={CircleParking} tone="bg-[#eef4ff] text-[#2563eb]" />
      <Stat label="已满车位" value={full} detail={`${slots.length ? Math.round(full / slots.length * 100) : 0}%`} icon={CircleCheck} tone="bg-[#eaf8f1] text-[#087a55]" />
      <Stat label="有空车位" value={open} detail="可继续添加车友" icon={UsersRound} tone="bg-[#fff5e8] text-[#b45309]" />
      <Stat label="即将到期" value={upcoming} detail={`未来 ${reminderCutoff} 天`} icon={Clock3} tone="bg-[#fff4e5] text-[#c05b0a]" />
      <Stat label="已过期" value={expired} detail="需要处理" icon={AlertTriangle} tone="bg-[#fff0f0] text-[#c93636]" />
    </section>
    <section className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3.5"><div><h2 className="font-semibold">最近车位</h2><p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">最近更新的账号与占用情况</p></div><Link className="btn min-h-8 text-[12px]" href="/slots">查看全部 <ArrowRight size={14} /></Link></div><div className="data-wrap"><table className="data-table"><thead><tr><th>车号</th><th>平台</th><th>主账号</th><th>状态</th><th>容量</th><th>续费日</th><th>最近到期</th></tr></thead><tbody>{slots.slice(0, 10).map((slot) => { const status = slotStatus(slot.capacity, slot.members.length, slot.status); const next = slot.members[0]; return <tr key={slot.id}><td><Link href={`/slots?open=${slot.id}`} className="font-semibold">#{slot.slotNumber}</Link></td><td><span className="flex items-center gap-2"><PlatformIcon slug={slot.platform.slug} name={slot.platform.name} icon={slot.platform.icon} size={15} />{slot.platform.name}</span></td><td className="text-[#2457bd]">{slot.accountEmail}</td><td><Badge tone={status === "满" ? "success" : status === "空闲" ? "neutral" : "urgent"}>{status}</Badge></td><td>{slot.members.length}/{slot.capacity}</td><td>每月 {slot.billingDay} 日</td><td>{next ? <Badge tone={expiryLabel(next.expireDate).tone}>{expiryLabel(next.expireDate).text}</Badge> : "-"}</td></tr>; })}</tbody></table></div></section>
    <section className="panel p-4"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">近期到期提醒</h2><p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">按紧急程度排列</p></div><Link className="btn min-h-8 text-[12px]" href="/reminders"><BellRing size={14} />查看全部提醒</Link></div>{reminders.length ? <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{reminders.map((member) => { const expiry = expiryLabel(member.expireDate); const item: MemberItem = { id: member.id, nickname: member.nickname, contact: member.contact, startDate: member.startDate.toISOString(), expireDate: member.expireDate.toISOString(), status: member.status, note: member.note }; return <article key={member.id} className="rounded-[6px] border border-[var(--border)] bg-white p-3.5 transition-colors hover:border-[#bac5d6]"><Link href={`/slots?open=${member.slotId}`} className="block"><div className="flex items-start justify-between gap-2"><strong className="truncate">{member.nickname}</strong><Badge tone={expiry.tone}>{expiry.text}</Badge></div><p className="mt-2 text-[12px] text-[var(--muted-foreground)]">{member.slot.platform.name} · 车位 #{member.slot.slotNumber}</p></Link><div className="mt-3 flex items-center justify-between gap-2"><p className="min-w-0 truncate text-[11px] text-[#687386]">{member.contact}</p><RenewButton member={item} compact /></div></article>; })}</div> : <div className="empty">未来 {reminderCutoff} 天没有到期提醒</div>}</section>
  </div>;
}
