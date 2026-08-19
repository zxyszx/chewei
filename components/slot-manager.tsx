"use client";

import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Clipboard, Columns3, Copy, Eye, EyeOff, MoreHorizontal, Plus, Search, Table2, UserPlus, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { addMemberAction, createSlotAction, exitMemberAction, moveMemberFormAction, renewMemberAction, revealPasswordAction } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { FormDialog } from "@/components/form-dialog";
import { Badge, SubmitButton } from "@/components/ui";
import { expiryLabel, slotStatus } from "@/lib/dates";
import { cn, publicId } from "@/lib/utils";

export type PlatformOption = { id: string; name: string; slug: string; defaultCapacity: number };
export type MemberItem = { id: string; nickname: string; contact: string; startDate: string; expireDate: string; status: string; note: string | null };
export type RenewalItem = { id: string; oldExpireDate: string; newExpireDate: string; amount: string; paymentMethod: string; createdAt: string; member: { nickname: string } };
export type SlotItem = { id: string; slotNumber: number; accountEmail: string; cardLast4: string | null; billingDay: number; capacity: number; status: string; note: string | null; platform: PlatformOption; members: MemberItem[]; renewals: RenewalItem[] };
const viewOptions = [
  { value: "table" as const, icon: Table2, label: "表格" },
  { value: "board" as const, icon: Columns3, label: "看板" },
  { value: "calendar" as const, icon: CalendarDays, label: "日历" },
];

function toneForSlot(status: string) {
  if (status === "满") return "success" as const;
  if (status === "空闲") return "neutral" as const;
  if (status === "暂停" || status === "异常") return "danger" as const;
  return "urgent" as const;
}

function Expiry({ value }: { value: string }) {
  const info = expiryLabel(new Date(value));
  return <Badge tone={info.tone}>{info.text}</Badge>;
}

function NewSlotForm({ platforms, close }: { platforms: PlatformOption[]; close: () => void }) {
  const [platformId, setPlatformId] = useState(platforms[0]?.id || "");
  const capacity = platforms.find((p) => p.id === platformId)?.defaultCapacity || 5;
  return <ActionForm action={createSlotAction} onSuccess={close} className="grid gap-4 sm:grid-cols-2">
    <div><label className="label" htmlFor="platformId">平台</label><select className="select" id="platformId" name="platformId" value={platformId} onChange={(e) => setPlatformId(e.target.value)}>{platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
    <div><label className="label" htmlFor="slotNumber">车号</label><input className="input" id="slotNumber" name="slotNumber" type="number" min="1" required /></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="accountEmail">主账号 Gmail</label><input className="input" id="accountEmail" name="accountEmail" type="email" autoComplete="off" required /></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="password">账号密码</label><input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={6} required /></div>
    <div><label className="label" htmlFor="cardLast4">信用卡尾号</label><input className="input" id="cardLast4" name="cardLast4" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} /></div>
    <div><label className="label" htmlFor="billingDay">每月续费日</label><input className="input" id="billingDay" name="billingDay" type="number" min="1" max="31" required /></div>
    <div><label className="label" htmlFor="capacity">容量</label><input key={`${platformId}-${capacity}`} className="input" id="capacity" name="capacity" type="number" min="1" max="99" defaultValue={capacity} required /></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="note">备注</label><textarea className="textarea" id="note" name="note" /></div>
    <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4 sm:col-span-2"><button type="button" className="btn" onClick={close}>取消</button><SubmitButton>保存车位</SubmitButton></div>
  </ActionForm>;
}

function AddMemberForm({ slot, close }: { slot: SlotItem; close: () => void }) {
  const today = format(new Date(), "yyyy-MM-dd");
  return <ActionForm action={addMemberAction} onSuccess={close} className="grid gap-4 sm:grid-cols-2">
    <input type="hidden" name="slotId" value={slot.id} />
    <div><label className="label" htmlFor="nickname">昵称</label><input className="input" id="nickname" name="nickname" required /></div>
    <div><label className="label" htmlFor="contact">联系方式</label><input className="input" id="contact" name="contact" required /></div>
    <div><label className="label" htmlFor="startDate">开始日期</label><input className="input" id="startDate" name="startDate" type="date" defaultValue={today} required /></div>
    <div><label className="label" htmlFor="expireDate">到期日期</label><input className="input" id="expireDate" name="expireDate" type="date" defaultValue={format(addMonths(new Date(), 1), "yyyy-MM-dd")} required /></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="memberNote">备注</label><textarea className="textarea" id="memberNote" name="note" /></div>
    <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4 sm:col-span-2"><button type="button" className="btn" onClick={close}>取消</button><SubmitButton>添加车友</SubmitButton></div>
  </ActionForm>;
}

function MoveMemberForm({ member, slots, close }: { member: MemberItem; slots: SlotItem[]; close: () => void }) {
  const available = slots.filter((slot) => slot.members.filter((item) => item.status === "ACTIVE").length < slot.capacity && !slot.members.some((item) => item.id === member.id));
  return <ActionForm action={moveMemberFormAction} onSuccess={close} className="space-y-4"><input type="hidden" name="memberId" value={member.id} /><div><label className="label" htmlFor="targetSlotId">目标车位</label><select className="select" id="targetSlotId" name="targetSlotId" required defaultValue=""><option value="" disabled>请选择有空位的车位</option>{available.map((slot) => { const count = slot.members.filter((item) => item.status === "ACTIVE").length; return <option key={slot.id} value={slot.id}>{slot.platform.name} #{slot.slotNumber} · {count}/{slot.capacity}</option>; })}</select></div>{!available.length && <p className="rounded-[6px] bg-[#fff5e8] p-3 text-[12px] text-[#9a4e08]">当前没有可用目标车位</p>}<div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4"><button type="button" className="btn" onClick={close}>取消</button><SubmitButton disabled={!available.length}>确认换位</SubmitButton></div></ActionForm>;
}

export function RenewalForm({ member, close }: { member: MemberItem; close: () => void }) {
  const [months, setMonths] = useState(1);
  return <ActionForm action={renewMemberAction} onSuccess={close} className="grid gap-4 sm:grid-cols-2">
    <input type="hidden" name="memberId" value={member.id} />
    <div className="sm:col-span-2 rounded-[6px] border border-[var(--border)] bg-[#fafbfc] p-3"><span className="text-[12px] text-[var(--muted-foreground)]">车友</span><strong className="ml-3">{member.nickname}</strong><span className="ml-3 text-[12px] text-[var(--muted-foreground)]">当前到期 {format(new Date(member.expireDate), "yyyy.MM.dd")}</span></div>
    <div><label className="label" htmlFor="months">续费周期</label><select className="select" id="months" name="months" value={months} onChange={(e) => setMonths(Number(e.target.value))}><option value="1">1 个月</option><option value="3">3 个月</option><option value="6">6 个月</option><option value="12">12 个月</option><option value="0">自定义日期</option></select></div>
    {months === 0 && <div><label className="label" htmlFor="newExpireDate">新到期时间</label><input className="input" id="newExpireDate" name="newExpireDate" type="date" required /></div>}
    <div><label className="label" htmlFor="amount">金额</label><input className="input" id="amount" name="amount" type="number" min="0" step="0.01" defaultValue="90" required /></div>
    <div><label className="label" htmlFor="paymentMethod">付款方式</label><select className="select" id="paymentMethod" name="paymentMethod" defaultValue="WECHAT"><option value="WECHAT">微信</option><option value="ALIPAY">支付宝</option><option value="CARD">信用卡</option><option value="CASH">现金</option><option value="OTHER">其他</option></select></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="renewNote">备注</label><textarea className="textarea" id="renewNote" name="note" /></div>
    <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4 sm:col-span-2"><button type="button" className="btn" onClick={close}>取消</button><SubmitButton>确认续费</SubmitButton></div>
  </ActionForm>;
}

function SlotDrawer({ slot, close, addMember, renew, move }: { slot: SlotItem; close: () => void; addMember: () => void; renew: (member: MemberItem) => void; move: (member: MemberItem) => void }) {
  const activeMembers = slot.members.filter((m) => m.status === "ACTIVE");
  const status = slotStatus(slot.capacity, activeMembers.length, slot.status);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();
  const reveal = () => startTransition(async () => { const result = await revealPasswordAction(slot.id); if (result.ok && result.data?.password) { setPassword(result.data.password); setShowPassword(true); toast.success(result.message); } else toast.error(result.message); });
  const copy = async (value: string, message: string) => { await navigator.clipboard.writeText(value); toast.success(message); };
  const exit = (member: MemberItem) => {
    if (!window.confirm(`确认将 ${member.nickname} 标记为退出？`)) return;
    startTransition(async () => { const result = await exitMemberAction(member.id); if (result.ok) toast.success(result.message); else toast.error(result.message); });
  };
  return <div className="fixed inset-0 z-[70] bg-black/20" onMouseDown={close}><aside className="absolute inset-y-0 right-0 flex w-full max-w-[500px] flex-col border-l border-[var(--border)] bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()} aria-label={`车位 ${slot.slotNumber} 详情`}>
    <div className="flex h-[58px] items-center justify-between border-b border-[var(--border)] px-5"><div><strong className="text-[15px]">车位 #{slot.slotNumber} 详情</strong><span className="ml-3 text-[11px] text-[#8a94a3]">ID: {publicId(slot.platform.slug, slot.slotNumber)}</span></div><button className="btn icon-btn" onClick={close} aria-label="关闭详情"><X size={17} /></button></div>
    <div className="min-h-0 flex-1 overflow-y-auto">
      <section className="border-b border-[var(--border)] px-5 py-5"><div className="mb-5 flex items-center gap-3"><div className="grid size-9 place-items-center rounded-[6px] bg-[#f2f4f7] font-bold">{slot.platform.name[0]}</div><strong className="text-[16px]">{slot.platform.name}</strong><Badge tone={toneForSlot(status)}>{status}</Badge><span className="text-[13px] text-[var(--muted-foreground)]">{activeMembers.length}/{slot.capacity}</span></div>
        <dl className="grid grid-cols-[112px_minmax(0,1fr)] gap-y-4 text-[13px]"><dt className="text-[var(--muted-foreground)]">主账号</dt><dd className="flex min-w-0 items-center gap-2"><span className="truncate">{slot.accountEmail}</span><button onClick={() => copy(slot.accountEmail, "账号已复制")} className="text-[#6d7787]" aria-label="复制账号" title="复制账号"><Copy size={15} /></button></dd><dt className="text-[var(--muted-foreground)]">密码</dt><dd className="flex items-center gap-2"><span className="min-w-[108px] font-mono">{showPassword ? password : "••••••••••"}</span>{showPassword ? <button onClick={() => setShowPassword(false)} aria-label="隐藏密码"><EyeOff size={15} /></button> : <button onClick={reveal} disabled={pending} aria-label="查看密码"><Eye size={15} /></button>}{showPassword && <button onClick={() => copy(password, "密码已复制")} aria-label="复制密码"><Copy size={15} /></button>}</dd><dt className="text-[var(--muted-foreground)]">信用卡尾号</dt><dd>{slot.cardLast4 ? `•••• ${slot.cardLast4}` : "-"}</dd><dt className="text-[var(--muted-foreground)]">续费日期</dt><dd>每月 {slot.billingDay} 日</dd><dt className="text-[var(--muted-foreground)]">备注</dt><dd className="whitespace-pre-wrap">{slot.note || "-"}</dd></dl>
      </section>
      <section className="border-b border-[var(--border)] px-5 py-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">车友列表 <span className="font-normal text-[var(--muted-foreground)]">({activeMembers.length}/{slot.capacity})</span></h3><button className="btn min-h-8 px-2.5 text-[12px] text-[#2563eb]" onClick={addMember} disabled={activeMembers.length >= slot.capacity}><UserPlus size={14} />添加车友</button></div>
        <div className="overflow-hidden rounded-[6px] border border-[var(--border)]">{activeMembers.length ? activeMembers.map((member) => <div key={member.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-[var(--border)] p-3 last:border-0"><div className="min-w-0"><div className="flex items-center gap-2"><strong className="truncate text-[13px]">{member.nickname}</strong><Expiry value={member.expireDate} /></div><p className="mt-1 truncate text-[12px] text-[var(--muted-foreground)]">{member.contact} · {format(new Date(member.expireDate), "yyyy.MM.dd")}</p></div><div className="flex items-center gap-1"><button className="btn min-h-8 px-2 text-[12px]" onClick={() => renew(member)}>续费</button><button className="btn min-h-8 px-2 text-[12px]" onClick={() => move(member)}>换位</button><button className="btn icon-btn size-8" onClick={() => exit(member)} aria-label={`将 ${member.nickname} 标记退出`} title="标记退出"><MoreHorizontal size={15} /></button></div></div>) : <div className="empty py-8">暂无在位车友</div>}</div>
      </section>
      <section className="px-5 py-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">续费记录</h3><span className="text-[12px] text-[var(--muted-foreground)]">最近 {slot.renewals.length} 条</span></div><div className="overflow-hidden rounded-[6px] border border-[var(--border)]">{slot.renewals.length ? slot.renewals.slice(0, 5).map((record) => <div key={record.id} className="grid grid-cols-[1fr_auto] border-b border-[var(--border)] px-3 py-2.5 text-[12px] last:border-0"><div><strong>{record.member.nickname}</strong><span className="ml-2 text-[var(--muted-foreground)]">{format(new Date(record.createdAt), "yyyy.MM.dd")}</span></div><span className="tabular">¥ {Number(record.amount).toFixed(2)}</span></div>) : <div className="empty py-8">暂无续费记录</div>}</div></section>
    </div>
  </aside></div>;
}

export function SlotManager({ slots, platforms, initialOpen }: { slots: SlotItem[]; platforms: PlatformOption[]; initialOpen?: string }) {
  const [view, setView] = useState<"table" | "board" | "calendar">("table");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(initialOpen || "");
  const [newSlot, setNewSlot] = useState(false);
  const [addMember, setAddMember] = useState(false);
  const [renewMember, setRenewMember] = useState<MemberItem | null>(null);
  const [moveMember, setMoveMember] = useState<MemberItem | null>(null);
  const [month, setMonth] = useState(new Date());
  const selected = slots.find((slot) => slot.id === selectedId);
  const filtered = useMemo(() => slots.filter((slot) => {
    const active = slot.members.filter((m) => m.status === "ACTIVE").length;
    const status = slotStatus(slot.capacity, active, slot.status);
    return (statusFilter === "all" || status === statusFilter) && `${slot.slotNumber} ${slot.accountEmail} ${slot.platform.name} ${slot.members.map((m) => `${m.nickname} ${m.contact}`).join(" ")}`.toLowerCase().includes(query.toLowerCase());
  }), [slots, query, statusFilter]);
  const events = slots.flatMap((slot) => slot.members.filter((m) => m.status === "ACTIVE").map((member) => ({ slot, member, date: new Date(member.expireDate) })));
  const calendarDays = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) });
  return <>
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3"><div className="flex items-center gap-3"><strong className="text-[15px]">车位列表 <span className="font-normal text-[var(--muted-foreground)]">({filtered.length})</span></strong><div className="flex rounded-[6px] border border-[var(--border)] bg-[#fafbfc] p-0.5">{viewOptions.map(({ value, icon: Icon, label }) => <button key={value} onClick={() => setView(value)} className={cn("flex min-h-8 items-center gap-1.5 rounded-[4px] px-2.5 text-[12px] text-[#657080]", view === value && "bg-white text-[#2457bd] shadow-sm")}><Icon size={14} />{label}</button>)}</div></div><button className="btn btn-primary" onClick={() => setNewSlot(true)}><Plus size={16} />新建车位</button></div>
      <div className="toolbar border-b border-[var(--border)] px-4 py-3"><div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-[6px] border border-[var(--border-strong)] bg-white px-3"><Search size={15} className="text-[#7b8493]" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 min-w-0 flex-1 outline-none" placeholder="搜索车位、账号、车友..." /></div><select className="select w-auto min-w-[120px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">全部状态</option>{["满", "缺1", "缺2", "缺3", "缺4", "空闲", "暂停", "异常"].map((s) => <option key={s}>{s}</option>)}</select><a className="btn" href="/api/export/slots"><Clipboard size={15} />导出</a></div>
      {view === "table" && <div className="data-wrap"><table className="data-table"><thead><tr><th>车号</th><th>平台</th><th>主账号 Gmail</th><th>状态</th><th>容量</th><th>续费日</th><th>卡尾号</th><th>最近到期</th><th>备注</th><th aria-label="操作" /></tr></thead><tbody>{filtered.map((slot) => { const active = slot.members.filter((m) => m.status === "ACTIVE"); const status = slotStatus(slot.capacity, active.length, slot.status); const next = active.toSorted((a, b) => +new Date(a.expireDate) - +new Date(b.expireDate))[0]; return <tr key={slot.id} onClick={() => setSelectedId(slot.id)} className="cursor-pointer"><td className="font-semibold tabular">#{slot.slotNumber}</td><td>{slot.platform.name}</td><td className="text-[#2457bd]">{slot.accountEmail}</td><td><Badge tone={toneForSlot(status)}>{status}</Badge></td><td className="tabular">{active.length}/{slot.capacity}</td><td>每月 {slot.billingDay} 日</td><td>{slot.cardLast4 || "-"}</td><td>{next ? <div className="flex items-center gap-2"><span className="tabular">{format(new Date(next.expireDate), "yyyy.MM.dd")}</span><Expiry value={next.expireDate} /></div> : "-"}</td><td className="max-w-[150px] truncate text-[var(--muted-foreground)]">{slot.note || "-"}</td><td><button className="btn icon-btn size-8" aria-label={`查看车位 ${slot.slotNumber}`}><MoreHorizontal size={15} /></button></td></tr>; })}</tbody></table>{!filtered.length && <div className="empty">没有符合条件的车位</div>}</div>}
      {view === "board" && <div className="grid min-h-[520px] auto-cols-[260px] grid-flow-col gap-3 overflow-x-auto bg-[#fafbfc] p-4">{["满", "缺1", "缺2", "缺3", "缺4", "空闲"].map((group) => { const groupSlots = filtered.filter((slot) => slotStatus(slot.capacity, slot.members.filter((m) => m.status === "ACTIVE").length, slot.status) === group); return <section key={group} className="w-[260px]"><div className="mb-2 flex items-center justify-between px-1"><Badge tone={toneForSlot(group)}>{group}</Badge><span className="text-[12px] text-[var(--muted-foreground)]">{groupSlots.length}</span></div><div className="space-y-2">{groupSlots.map((slot) => { const active = slot.members.filter((m) => m.status === "ACTIVE"); const next = active.toSorted((a, b) => +new Date(a.expireDate) - +new Date(b.expireDate))[0]; return <button key={slot.id} onClick={() => setSelectedId(slot.id)} className="panel w-full p-3 text-left transition-colors hover:border-[#aab9d1]"><div className="flex items-center justify-between"><strong>{slot.platform.name} #{slot.slotNumber}</strong><span className="text-[12px] tabular text-[var(--muted-foreground)]">{active.length}/{slot.capacity}</span></div><p className="mt-2 truncate text-[12px] text-[#2457bd]">{slot.accountEmail}</p><p className="mt-3 text-[11px] text-[var(--muted-foreground)]">最近到期：{next ? format(new Date(next.expireDate), "MM.dd") : "-"}</p></button>; })}</div></section>; })}</div>}
      {view === "calendar" && <div className="p-4"><div className="mb-3 flex items-center justify-between"><button className="btn icon-btn" onClick={() => setMonth(subMonths(month, 1))} aria-label="上个月"><ChevronLeft size={16} /></button><strong>{format(month, "yyyy 年 M 月", { locale: zhCN })}</strong><button className="btn icon-btn" onClick={() => setMonth(addMonths(month, 1))} aria-label="下个月"><ChevronRight size={16} /></button></div><div className="grid grid-cols-7 border-l border-t border-[var(--border)]">{["一", "二", "三", "四", "五", "六", "日"].map((day) => <div key={day} className="border-b border-r border-[var(--border)] bg-[#fafbfc] p-2 text-center text-[11px] text-[var(--muted-foreground)]">{day}</div>)}{calendarDays.map((day) => { const dayEvents = events.filter((event) => isSameDay(event.date, day)); return <div key={day.toISOString()} className={cn("min-h-[110px] border-b border-r border-[var(--border)] p-1.5", !isSameMonth(day, month) && "bg-[#fafbfc] text-[#a2a9b5]")}><div className="mb-1 text-[11px] tabular">{format(day, "d")}</div><div className="space-y-1">{dayEvents.slice(0, 3).map(({ slot, member }) => <button key={member.id} onClick={() => setSelectedId(slot.id)} className="block w-full truncate rounded-[4px] bg-[#eef4ff] px-1.5 py-1 text-left text-[10px] text-[#2457bd]">{slot.platform.name} #{slot.slotNumber} · {member.nickname}</button>)}{dayEvents.length > 3 && <span className="px-1 text-[10px] text-[var(--muted-foreground)]">+{dayEvents.length - 3} 条</span>}</div></div>; })}</div></div>}
    </div>
    {selected && <SlotDrawer slot={selected} close={() => setSelectedId("")} addMember={() => setAddMember(true)} renew={setRenewMember} move={setMoveMember} />}
    <FormDialog open={newSlot} title="新建车位" description="平台默认容量可按实际套餐调整" onClose={() => setNewSlot(false)}><NewSlotForm platforms={platforms} close={() => setNewSlot(false)} /></FormDialog>
    {selected && <FormDialog open={addMember} title={`添加车友 · ${selected.platform.name} #${selected.slotNumber}`} description={`当前 ${selected.members.filter((m) => m.status === "ACTIVE").length}/${selected.capacity}`} onClose={() => setAddMember(false)}><AddMemberForm slot={selected} close={() => setAddMember(false)} /></FormDialog>}
    {renewMember && <FormDialog open title="续费" description="确认后将保留原到期时间并新增历史记录" onClose={() => setRenewMember(null)}><RenewalForm member={renewMember} close={() => setRenewMember(null)} /></FormDialog>}
    {moveMember && <FormDialog open title={`更换车位 · ${moveMember.nickname}`} description="续费历史不会随换位改变" onClose={() => setMoveMember(null)}><MoveMemberForm member={moveMember} slots={slots} close={() => setMoveMember(null)} /></FormDialog>}
  </>;
}
