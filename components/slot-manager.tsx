"use client";

import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Clipboard, Columns3, Copy, Eye, EyeOff, MoreHorizontal, Pencil, Plus, Search, Table2, Trash2, UserPlus, UserRoundX, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { addMemberAction, createSlotAction, deleteMemberAction, deleteSlotAction, exitMemberAction, moveMemberFormAction, renewMemberAction, revealPasswordAction, updateMemberAction, updateSlotAction } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { ConfirmDialog, FormDialog } from "@/components/form-dialog";
import { PasswordCell } from "@/components/password-cell";
import { PlatformIcon } from "@/components/platform-icon";
import { Badge, SubmitButton } from "@/components/ui";
import { expiryLabel, slotStatus } from "@/lib/dates";
import { cn, publicId } from "@/lib/utils";

export type PlatformOption = { id: string; name: string; slug: string; icon?: string | null; defaultCapacity: number };
export type MemberItem = { id: string; nickname: string; contact: string; startDate: string; expireDate: string; status: string; seatNumber?: number | null; note: string | null };
export type RenewalItem = { id: string; oldExpireDate: string; newExpireDate: string; amount: string; paymentMethod: string; createdAt: string; member: { nickname: string } };
export type SlotItem = { id: string; slotNumber: number; accountEmail: string; cardLast4: string | null; billingDay: number; capacity: number; status: string; note: string | null; platform: PlatformOption; members: MemberItem[]; renewals: RenewalItem[] };
type Confirmation = { kind: "exit" | "delete-member"; member: MemberItem } | { kind: "delete-slot" };
const viewOptions = [
  { value: "table" as const, icon: Table2, label: "表格" },
  { value: "board" as const, icon: Columns3, label: "看板" },
  { value: "calendar" as const, icon: CalendarDays, label: "日历" },
];

function closeOpenActionMenus() {
  document.querySelectorAll<HTMLDetailsElement>("details.action-menu[open]").forEach((menu) => { menu.open = false; });
}

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

function SeatButtons({ slot, members, onMember, onEmpty }: { slot: SlotItem; members: MemberItem[]; onMember: (member: MemberItem) => void; onEmpty: (seatNumber: number) => void }) {
  return <div className="flex min-w-max items-center gap-1.5" aria-label={`${slot.platform.name} 合租车位 #${slot.slotNumber}，已使用 ${members.length}/${slot.capacity} 个席位`}>
    {Array.from({ length: slot.capacity }, (_, index) => {
      const member = members.find((item) => item.seatNumber === index + 1);
      if (!member) return <button key={`empty-${index}`} type="button" className="seat-button seat-button-empty" title={`席位 ${index + 1}\n当前空闲\n点击添加车友`} aria-label={`席位 ${index + 1}，当前空闲，点击添加车友`} onClick={(event) => { event.stopPropagation(); onEmpty(index + 1); }}><Plus size={14} /></button>;
      const expiry = expiryLabel(new Date(member.expireDate));
      const tone = expiry.days < 0 ? "seat-button-danger" : expiry.days <= 7 ? "seat-button-warning" : "seat-button-full";
      return <button key={member.id} type="button" className={cn("seat-button", tone)} title={`席位 ${index + 1}\n${member.nickname}\n到期：${format(new Date(member.expireDate), "yyyy.MM.dd")}\n${expiry.text}`} aria-label={`席位 ${index + 1}，${member.nickname}，${expiry.text}，点击编辑车友`} onClick={(event) => { event.stopPropagation(); onMember(member); }}>{member.nickname.slice(0, 1).toUpperCase()}</button>;
    })}
  </div>;
}

function NewSlotForm({ platforms, close }: { platforms: PlatformOption[]; close: () => void }) {
  const [platformId, setPlatformId] = useState(platforms[0]?.id || "");
  const capacity = platforms.find((p) => p.id === platformId)?.defaultCapacity || 5;
  return <ActionForm action={createSlotAction} onSuccess={close} className="grid gap-4 sm:grid-cols-2">
    <div><label className="label" htmlFor="platformId">平台</label><select className="select" id="platformId" name="platformId" value={platformId} onChange={(e) => setPlatformId(e.target.value)}>{platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
    <div><label className="label" htmlFor="slotNumber">账号编号</label><input className="input" id="slotNumber" name="slotNumber" type="number" min="1" required /></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="accountEmail">登录账号</label><input className="input" id="accountEmail" name="accountEmail" type="email" autoComplete="off" required /></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="password">账号密码</label><input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={6} required /></div>
    <div><label className="label" htmlFor="cardLast4">信用卡尾号</label><input className="input" id="cardLast4" name="cardLast4" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} /></div>
    <div><label className="label" htmlFor="billingDay">每月续费日</label><input className="input" id="billingDay" name="billingDay" type="number" min="1" max="31" required /></div>
    <div><label className="label" htmlFor="capacity">成员席位数</label><input key={`${platformId}-${capacity}`} className="input" id="capacity" name="capacity" type="number" min="1" max="99" defaultValue={capacity} required /></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="note">备注</label><textarea className="textarea" id="note" name="note" /></div>
    <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4 sm:col-span-2"><button type="button" className="btn" onClick={close}>取消</button><SubmitButton>保存车位</SubmitButton></div>
  </ActionForm>;
}

function AddMemberForm({ slot, seatNumber, close }: { slot: SlotItem; seatNumber?: number | null; close: () => void }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(today);
  const [duration, setDuration] = useState(1);
  const expireDate = startDate ? format(addMonths(new Date(`${startDate}T00:00:00`), duration), "yyyy-MM-dd") : "";
  return <ActionForm action={addMemberAction} onSuccess={close} className="grid gap-4 sm:grid-cols-2">
    <input type="hidden" name="slotId" value={slot.id} />
    <input type="hidden" name="expireDate" value={expireDate} />
    <input type="hidden" name="months" value={duration} />
    {seatNumber && <input type="hidden" name="seatNumber" value={seatNumber} />}
    <div><label className="label" htmlFor="nickname">昵称</label><input className="input" id="nickname" name="nickname" required /></div>
    <div><label className="label" htmlFor="contact">联系方式</label><input className="input" id="contact" name="contact" required /></div>
    <div><label className="label" htmlFor="startDate">开始日期</label><input className="input" id="startDate" name="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></div>
    <div><span className="label">自动到期</span><output className="input flex items-center tabular">{expireDate}</output></div>
    <fieldset className="sm:col-span-2"><legend className="label">套餐周期</legend><div className="segmented-control grid grid-cols-4" role="radiogroup" aria-label="套餐周期">{[1, 3, 6, 12].map((months) => <button key={months} type="button" role="radio" aria-checked={duration === months} className={cn("min-h-10 px-3 text-[12px] font-semibold", duration === months && "segmented-active")} onClick={() => setDuration(months)}>{months} 个月</button>)}</div></fieldset>
    <div><label className="label" htmlFor="initialAmount">入位金额</label><div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[13px] text-[var(--muted-foreground)]">¥</span><input className="input pl-7" id="initialAmount" name="amount" type="number" min="0" step="0.01" defaultValue="90" required /></div></div>
    <div><label className="label" htmlFor="initialPaymentMethod">付款方式</label><select className="select" id="initialPaymentMethod" name="paymentMethod" defaultValue="WECHAT"><option value="WECHAT">微信</option><option value="ALIPAY">支付宝</option><option value="CARD">信用卡</option><option value="CASH">现金</option><option value="OTHER">其他</option></select></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="memberNote">备注</label><textarea className="textarea" id="memberNote" name="note" /></div>
    <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4 sm:col-span-2"><button type="button" className="btn" onClick={close}>取消</button><SubmitButton>添加车友</SubmitButton></div>
  </ActionForm>;
}

function EditSlotForm({ slot, platforms, close }: { slot: SlotItem; platforms: PlatformOption[]; close: () => void }) {
  return <ActionForm action={updateSlotAction} onSuccess={close} className="grid gap-4 sm:grid-cols-2">
    <input type="hidden" name="slotId" value={slot.id} />
    <div><label className="label" htmlFor="editPlatformId">平台</label><select className="select" id="editPlatformId" name="platformId" defaultValue={slot.platform.id}>{platforms.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}</option>)}</select></div>
    <div><label className="label" htmlFor="editSlotNumber">账号编号</label><input className="input" id="editSlotNumber" name="slotNumber" type="number" min="1" defaultValue={slot.slotNumber} required /></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="editAccountEmail">登录账号</label><input className="input" id="editAccountEmail" name="accountEmail" type="email" defaultValue={slot.accountEmail} required /></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="editPassword">更换密码</label><input className="input" id="editPassword" name="password" type="password" autoComplete="new-password" minLength={6} placeholder="留空则保持原密码" /></div>
    <div><label className="label" htmlFor="editCardLast4">信用卡尾号</label><input className="input" id="editCardLast4" name="cardLast4" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} defaultValue={slot.cardLast4 || ""} /></div>
    <div><label className="label" htmlFor="editBillingDay">每月续费日</label><input className="input" id="editBillingDay" name="billingDay" type="number" min="1" max="31" defaultValue={slot.billingDay} required /></div>
    <div><label className="label" htmlFor="editCapacity">成员席位数</label><input className="input" id="editCapacity" name="capacity" type="number" min="1" max="99" defaultValue={slot.capacity} required /></div>
    <div><label className="label" htmlFor="editStatus">状态</label><select className="select" id="editStatus" name="status" defaultValue={slot.status}><option value="ACTIVE">正常</option><option value="PAUSED">暂停</option><option value="ABNORMAL">异常</option></select></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="editSlotNote">备注</label><textarea className="textarea" id="editSlotNote" name="note" defaultValue={slot.note || ""} /></div>
    <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4 sm:col-span-2"><button type="button" className="btn" onClick={close}>取消</button><SubmitButton>保存修改</SubmitButton></div>
  </ActionForm>;
}

function EditMemberForm({ member, close }: { member: MemberItem; close: () => void }) {
  const [startDate, setStartDate] = useState(member.startDate.slice(0, 10));
  const [expireDate, setExpireDate] = useState(member.expireDate.slice(0, 10));
  const [duration, setDuration] = useState(0);
  const applyDuration = (months: number) => {
    setDuration(months);
    setExpireDate(format(addMonths(new Date(`${startDate}T00:00:00`), months), "yyyy-MM-dd"));
  };
  const changeStartDate = (value: string) => {
    setStartDate(value);
    if (duration && value) setExpireDate(format(addMonths(new Date(`${value}T00:00:00`), duration), "yyyy-MM-dd"));
  };
  return <ActionForm action={updateMemberAction} onSuccess={close} className="grid gap-4 sm:grid-cols-2">
    <input type="hidden" name="memberId" value={member.id} />
    <div><label className="label" htmlFor="editNickname">昵称</label><input className="input" id="editNickname" name="nickname" defaultValue={member.nickname} required /></div>
    <div><label className="label" htmlFor="editContact">联系方式</label><input className="input" id="editContact" name="contact" defaultValue={member.contact} required /></div>
    <div><label className="label" htmlFor="editStartDate">开始日期</label><input className="input" id="editStartDate" name="startDate" type="date" value={startDate} onChange={(event) => changeStartDate(event.target.value)} required /></div>
    <div><label className="label" htmlFor="editExpireDate">到期日期</label><input className="input" id="editExpireDate" name="expireDate" type="date" value={expireDate} onChange={(event) => { setDuration(0); setExpireDate(event.target.value); }} required /></div>
    <fieldset className="sm:col-span-2"><legend className="label">按周期调整到期时间</legend><div className="segmented-control grid grid-cols-5" role="radiogroup" aria-label="按周期调整到期时间">{[1, 3, 6, 12].map((months) => <button key={months} type="button" role="radio" aria-checked={duration === months} className={cn("min-h-10 px-2 text-[12px] font-semibold", duration === months && "segmented-active")} onClick={() => applyDuration(months)}>{months} 个月</button>)}<button type="button" role="radio" aria-checked={duration === 0} className={cn("min-h-10 px-2 text-[12px] font-semibold", duration === 0 && "segmented-active")} onClick={() => setDuration(0)}>自定义</button></div></fieldset>
    <div className="sm:col-span-2"><label className="label" htmlFor="editMemberNote">备注</label><textarea className="textarea" id="editMemberNote" name="note" defaultValue={member.note || ""} /></div>
    <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4 sm:col-span-2"><button type="button" className="btn" onClick={close}>取消</button><SubmitButton>保存修改</SubmitButton></div>
  </ActionForm>;
}

function MoveMemberForm({ member, currentSlot, slots, close }: { member: MemberItem; currentSlot: SlotItem; slots: SlotItem[]; close: () => void }) {
  const available = slots.filter((slot) => slot.platform.id === currentSlot.platform.id && slot.status === "ACTIVE");
  const [targetSlotId, setTargetSlotId] = useState(currentSlot.id);
  const [targetSeatNumber, setTargetSeatNumber] = useState<number | null>(null);
  const targetSlot = available.find((slot) => slot.id === targetSlotId) || currentSlot;
  const activeMembers = targetSlot.members.filter((item) => item.status === "ACTIVE");
  return <ActionForm action={moveMemberFormAction} onSuccess={close} className="space-y-4">
    <input type="hidden" name="memberId" value={member.id} />
    <input type="hidden" name="targetSeatNumber" value={targetSeatNumber || ""} />
    <div className="rounded-[6px] border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-[12px]"><span className="text-[var(--muted-foreground)]">当前位置</span><strong className="ml-2">#{currentSlot.slotNumber} · 席位 {member.seatNumber || "-"}</strong></div>
    <div><label className="label" htmlFor="targetSlotId">目标合租车位</label><select className="select" id="targetSlotId" name="targetSlotId" required value={targetSlotId} onChange={(event) => { setTargetSlotId(event.target.value); setTargetSeatNumber(null); }}>{available.map((slot) => { const count = slot.members.filter((item) => item.status === "ACTIVE").length; return <option key={slot.id} value={slot.id}>{slot.platform.name} #{slot.slotNumber} · {count}/{slot.capacity}{slot.id === currentSlot.id ? " · 当前" : ""}</option>; })}</select></div>
    <fieldset><legend className="label">选择目标席位</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{Array.from({ length: targetSlot.capacity }, (_, index) => { const seatNumber = index + 1; const occupant = activeMembers.find((item) => item.seatNumber === seatNumber); const isCurrent = targetSlot.id === currentSlot.id && occupant?.id === member.id; const selected = targetSeatNumber === seatNumber; return <button key={seatNumber} type="button" role="radio" aria-checked={selected} disabled={isCurrent} className={cn("flex min-h-14 items-center justify-between rounded-[6px] border px-3 text-left transition-colors", selected ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] hover:bg-[var(--surface-subtle)]", isCurrent && "cursor-not-allowed opacity-45")} onClick={() => setTargetSeatNumber(seatNumber)}><span><strong className="block text-[13px]">席位 {seatNumber}</strong><span className="mt-0.5 block max-w-[100px] truncate text-[11px] text-[var(--muted-foreground)]">{isCurrent ? "当前位置" : occupant ? occupant.nickname : "空闲"}</span></span><span className={cn("text-[10px] font-semibold", occupant && !isCurrent ? "text-[#b45309]" : "text-[#0b7b59]")}>{isCurrent ? "当前" : occupant ? "互换" : "移入"}</span></button>; })}</div></fieldset>
    {targetSeatNumber && (() => { const occupant = activeMembers.find((item) => item.seatNumber === targetSeatNumber); return occupant && occupant.id !== member.id ? <p className="rounded-[6px] bg-[#fff5e8] p-3 text-[12px] text-[#9a4e08]">确认后，{member.nickname} 将与 {occupant.nickname} 互换位置，双方续费记录不变。</p> : null; })()}
    <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4"><button type="button" className="btn" onClick={close}>取消</button><SubmitButton disabled={!targetSeatNumber}>确认换位</SubmitButton></div>
  </ActionForm>;
}

export function RenewalForm({ member, close }: { member: MemberItem; close: () => void }) {
  const [months, setMonths] = useState(1);
  const nextDate = format(addMonths(new Date(member.expireDate), months || 1), "yyyy.MM.dd");
  const minimumCustomDate = format(addDays(new Date(member.expireDate), 1), "yyyy-MM-dd");
  return <ActionForm action={renewMemberAction} onSuccess={close} className="grid gap-4 sm:grid-cols-2">
    <input type="hidden" name="memberId" value={member.id} />
    <div className="sm:col-span-2 rounded-[6px] border border-[var(--border)] bg-[#fafbfc] p-3"><span className="text-[12px] text-[var(--muted-foreground)]">车友</span><strong className="ml-3">{member.nickname}</strong><span className="ml-3 text-[12px] text-[var(--muted-foreground)]">当前到期 {format(new Date(member.expireDate), "yyyy.MM.dd")}</span></div>
    <div><label className="label" htmlFor="months">续费周期</label><select className="select" id="months" name="months" value={months} onChange={(e) => setMonths(Number(e.target.value))}><option value="1">1 个月</option><option value="3">3 个月</option><option value="6">6 个月</option><option value="12">12 个月</option><option value="0">自定义日期</option></select></div>
    {months === 0 ? <div><label className="label" htmlFor="newExpireDate">新到期时间</label><input className="input" id="newExpireDate" name="newExpireDate" type="date" min={minimumCustomDate} required /></div> : <div><span className="label">新到期时间</span><output className="input flex items-center tabular">{nextDate}</output></div>}
    <div><label className="label" htmlFor="amount">金额</label><input className="input" id="amount" name="amount" type="number" min="0" step="0.01" defaultValue="90" required /></div>
    <div><label className="label" htmlFor="paymentMethod">付款方式</label><select className="select" id="paymentMethod" name="paymentMethod" defaultValue="WECHAT"><option value="WECHAT">微信</option><option value="ALIPAY">支付宝</option><option value="CARD">信用卡</option><option value="CASH">现金</option><option value="OTHER">其他</option></select></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="renewNote">备注</label><textarea className="textarea" id="renewNote" name="note" /></div>
    <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4 sm:col-span-2"><button type="button" className="btn" onClick={close}>取消</button><SubmitButton>确认续费</SubmitButton></div>
  </ActionForm>;
}

function SlotDrawer({ slot, focusedMemberId, close, addMember, editSlot, editMember, renew, move, canDelete }: { slot: SlotItem; focusedMemberId?: string; close: () => void; addMember: () => void; editSlot: () => void; editMember: (member: MemberItem) => void; renew: (member: MemberItem) => void; move: (member: MemberItem) => void; canDelete: boolean }) {
  const activeMembers = slot.members.filter((m) => m.status === "ACTIVE");
  const status = slotStatus(slot.capacity, activeMembers.length, slot.status);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [pending, startTransition] = useTransition();
  const drawer = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (document.querySelector("dialog[open]")) return;
      if (event.key === "Escape") { close(); return; }
      if (event.key !== "Tab") return;
      const focusable = [...(drawer.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])") || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, [close]);
  const reveal = () => startTransition(async () => { const result = await revealPasswordAction(slot.id); if (result.ok && result.data?.password) { setPassword(result.data.password); setShowPassword(true); toast.success(result.message); } else toast.error(result.message); });
  const copy = async (value: string, message: string) => { await navigator.clipboard.writeText(value); toast.success(message); };
  const confirmAction = () => startTransition(async () => {
    if (!confirmation) return;
    const result = confirmation.kind === "delete-slot" ? await deleteSlotAction(slot.id) : confirmation.kind === "delete-member" ? await deleteMemberAction(confirmation.member.id) : await exitMemberAction(confirmation.member.id);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success(result.message);
    setConfirmation(null);
    if (confirmation.kind === "delete-slot") close();
  });
  const confirmationCopy = confirmation?.kind === "delete-slot"
    ? { title: `删除 ${slot.platform.name} 车位 #${slot.slotNumber}`, description: "只有没有成员和续费历史的合租车位才能删除。删除后无法恢复。", confirmLabel: "永久删除", tone: "danger" as const }
    : confirmation?.kind === "delete-member"
      ? { title: `删除 ${confirmation.member.nickname}`, description: "只有没有续费历史的车友才能永久删除。已有记录的车友请使用“标记退出”。", confirmLabel: "永久删除", tone: "danger" as const }
      : confirmation?.kind === "exit"
        ? { title: `将 ${confirmation.member.nickname} 标记为退出`, description: "车友将从在位名单移除，已有续费记录会继续保留，之后仍可在历史记录中查询。", confirmLabel: "确认退出", tone: "warning" as const }
        : null;
  return <><div className="fixed inset-0 z-[70] bg-black/30" onMouseDown={close}><aside ref={drawer} role="dialog" aria-modal="true" className="absolute inset-y-0 right-0 flex w-full max-w-[500px] flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl" onMouseDown={(e) => e.stopPropagation()} aria-label={`合租车位 ${slot.slotNumber} 详情`}>
    <div className="flex min-h-[58px] items-center justify-between gap-3 border-b border-[var(--border)] px-5"><div className="min-w-0"><strong className="text-[15px]">合租车位 #{slot.slotNumber}</strong><span className="ml-3 text-[11px] text-[var(--muted-foreground)]">ID: {publicId(slot.platform.slug, slot.slotNumber)}</span></div><div className="flex items-center gap-1"><details className="action-menu relative"><summary className="btn icon-btn" aria-label="更多车位操作" title="更多操作"><MoreHorizontal size={17} /></summary><div className="menu-popover absolute right-0 top-[calc(100%+6px)] z-20 w-36 rounded-[7px] border border-[var(--border)] p-1.5 shadow-lg"><button className="menu-item w-full" onClick={() => { closeOpenActionMenus(); editSlot(); }}><Pencil size={14} />编辑账号</button>{canDelete && <button className="menu-item menu-item-danger w-full" disabled={pending} onClick={() => { closeOpenActionMenus(); setConfirmation({ kind: "delete-slot" }); }}><Trash2 size={14} />删除账号</button>}</div></details><button ref={closeButton} className="btn icon-btn" onClick={close} aria-label="关闭详情" title="关闭详情"><X size={17} /></button></div></div>
    <div className="min-h-0 flex-1 overflow-y-auto">
      <section className="border-b border-[var(--border)] px-5 py-5"><div className="mb-5 flex items-center gap-3"><PlatformIcon slug={slot.platform.slug} name={slot.platform.name} icon={slot.platform.icon} size={22} className="border border-[var(--border)]" /><strong className="text-[16px]">{slot.platform.name}</strong><Badge tone={toneForSlot(status)}>{status}</Badge><span className="text-[13px] text-[var(--muted-foreground)]">{activeMembers.length}/{slot.capacity}</span></div>
        <dl className="grid grid-cols-[112px_minmax(0,1fr)] gap-y-4 text-[13px]"><dt className="text-[var(--muted-foreground)]">登录账号</dt><dd className="flex min-w-0 items-center gap-2"><span className="truncate">{slot.accountEmail}</span><button onClick={() => copy(slot.accountEmail, "账号已复制")} className="text-[#6d7787]" aria-label="复制账号" title="复制账号"><Copy size={15} /></button></dd><dt className="text-[var(--muted-foreground)]">密码</dt><dd className="flex w-[180px] items-center gap-2"><button type="button" disabled={!showPassword} onClick={() => copy(password, "密码已复制")} className="min-w-0 flex-1 truncate text-left font-mono disabled:cursor-default disabled:opacity-100" aria-label={showPassword ? "复制密码" : "密码已隐藏"} title={showPassword ? "点击复制密码" : undefined}>{showPassword ? password : "••••••••••"}</button>{showPassword ? <button className="grid size-7 shrink-0 place-items-center rounded-[5px] hover:bg-[var(--surface-subtle)]" onClick={() => setShowPassword(false)} aria-label="隐藏密码" title="隐藏密码"><EyeOff size={15} /></button> : <button className="grid size-7 shrink-0 place-items-center rounded-[5px] hover:bg-[var(--surface-subtle)]" onClick={reveal} disabled={pending} aria-label="查看密码" title="查看密码"><Eye size={15} /></button>}</dd><dt className="text-[var(--muted-foreground)]">信用卡尾号</dt><dd>{slot.cardLast4 ? `•••• ${slot.cardLast4}` : "-"}</dd><dt className="text-[var(--muted-foreground)]">平台续费日</dt><dd>每月 {slot.billingDay} 日</dd><dt className="text-[var(--muted-foreground)]">备注</dt><dd className="whitespace-pre-wrap">{slot.note || "-"}</dd></dl>
      </section>
      <section className="border-b border-[var(--border)] px-5 py-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">车友列表 <span className="font-normal text-[var(--muted-foreground)]">({activeMembers.length}/{slot.capacity})</span></h3><button className="btn min-h-8 px-2.5 text-[12px] text-[#2563eb]" onClick={addMember} disabled={activeMembers.length >= slot.capacity}><UserPlus size={14} />添加车友</button></div>
        <div className="overflow-visible rounded-[6px] border border-[var(--border)]">{activeMembers.length ? activeMembers.map((member) => <div key={member.id} className={cn("grid gap-3 border-b border-[var(--border)] p-3 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto]", focusedMemberId === member.id && "bg-[var(--accent-soft)]")}><button type="button" className="min-w-0 text-left" onClick={() => editMember(member)} aria-label={`编辑车友 ${member.nickname}`}><div className="flex items-center gap-2"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[11px] font-semibold text-[var(--accent)]">{member.nickname.slice(0, 1).toUpperCase()}</span><strong className="truncate text-[13px]">{member.nickname}</strong><Expiry value={member.expireDate} /></div><p className="mt-1 truncate pl-9 text-[12px] text-[var(--muted-foreground)]">{member.contact} · {format(new Date(member.startDate), "yyyy.MM.dd")} 至 {format(new Date(member.expireDate), "yyyy.MM.dd")}</p>{member.note && <p className="mt-1 truncate pl-9 text-[11px] text-[var(--muted-foreground)]">{member.note}</p>}</button><div className="flex items-center gap-1"><button className="btn btn-primary min-h-8 px-2.5 text-[12px]" onClick={() => renew(member)}>续费</button><details className="action-menu relative"><summary className="btn icon-btn size-8" aria-label={`${member.nickname} 更多操作`} title="更多操作"><MoreHorizontal size={15} /></summary><div className="menu-popover absolute right-0 top-[calc(100%+5px)] z-20 w-36 rounded-[7px] border border-[var(--border)] p-1.5 shadow-lg"><button className="menu-item w-full" onClick={() => { closeOpenActionMenus(); move(member); }}>换位</button><button className="menu-item w-full" onClick={() => { closeOpenActionMenus(); copy(member.contact, "联系方式已复制"); }}><Copy size={14} />复制联系</button><button className="menu-item w-full" onClick={() => { closeOpenActionMenus(); editMember(member); }}><Pencil size={14} />编辑车友</button><button className="menu-item w-full" disabled={pending} onClick={() => { closeOpenActionMenus(); setConfirmation({ kind: "exit", member }); }}><UserRoundX size={14} />标记退出</button>{canDelete && <button className="menu-item menu-item-danger w-full" disabled={pending} onClick={() => { closeOpenActionMenus(); setConfirmation({ kind: "delete-member", member }); }}><Trash2 size={14} />永久删除</button>}</div></details></div></div>) : <div className="empty py-8">暂无在位车友</div>}</div>
      </section>
      <section className="px-5 py-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">续费记录</h3><span className="text-[12px] text-[var(--muted-foreground)]">最近 {slot.renewals.length} 条</span></div><div className="overflow-hidden rounded-[6px] border border-[var(--border)]">{slot.renewals.length ? slot.renewals.slice(0, 5).map((record) => <div key={record.id} className="grid grid-cols-[1fr_auto] border-b border-[var(--border)] px-3 py-2.5 text-[12px] last:border-0"><div><strong>{record.member.nickname}</strong><span className="ml-2 text-[var(--muted-foreground)]">{format(new Date(record.createdAt), "yyyy.MM.dd")}</span></div><span className="tabular">¥ {Number(record.amount).toFixed(2)}</span></div>) : <div className="empty py-8">暂无续费记录</div>}</div></section>
    </div>
  </aside></div>{confirmationCopy && <ConfirmDialog open title={confirmationCopy.title} description={confirmationCopy.description} confirmLabel={confirmationCopy.confirmLabel} tone={confirmationCopy.tone} pending={pending} onClose={() => setConfirmation(null)} onConfirm={confirmAction} />}</>;
}

export function SlotManager({ slots, platforms, initialOpen, initialCreate = false, closeHref = "/slots", singlePlatform = false, platformSlug, canDelete = false }: { slots: SlotItem[]; platforms: PlatformOption[]; initialOpen?: string; initialCreate?: boolean; closeHref?: string; singlePlatform?: boolean; platformSlug?: string; canDelete?: boolean }) {
  const router = useRouter();
  const [view, setView] = useState<"table" | "board" | "calendar">("table");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(initialOpen || "");
  const [newSlot, setNewSlot] = useState(initialCreate);
  const [editSlotId, setEditSlotId] = useState("");
  const [addMemberTarget, setAddMemberTarget] = useState<{ slotId: string; seatNumber: number | null } | null>(null);
  const [editMember, setEditMember] = useState<MemberItem | null>(null);
  const [renewMember, setRenewMember] = useState<MemberItem | null>(null);
  const [moveMember, setMoveMember] = useState<MemberItem | null>(null);
  const [focusedMemberId, setFocusedMemberId] = useState("");
  const [month, setMonth] = useState(new Date());
  const closeBusinessDialogs = () => { setEditSlotId(""); setAddMemberTarget(null); setEditMember(null); setRenewMember(null); setMoveMember(null); closeOpenActionMenus(); };
  const addMemberToSlot = (slotId: string, seatNumber?: number) => { closeBusinessDialogs(); setAddMemberTarget({ slotId, seatNumber: seatNumber || null }); };
  const editMemberInSlot = (_slotId: string, member: MemberItem) => { closeBusinessDialogs(); setEditMember(member); };
  const editSelectedSlot = (slotId: string) => { closeBusinessDialogs(); setEditSlotId(slotId); };
  const viewSlotDetails = (slotId: string) => { closeBusinessDialogs(); setFocusedMemberId(""); setSelectedId(slotId); };
  const closeNewSlot = () => { setNewSlot(false); if (initialCreate) router.replace(closeHref, { scroll: false }); };
  const closeSelected = useCallback(() => { setSelectedId(""); setFocusedMemberId(""); router.replace(closeHref, { scroll: false }); }, [closeHref, router]);
  const selected = slots.find((slot) => slot.id === selectedId);
  const editingSlot = slots.find((slot) => slot.id === editSlotId);
  const addingSlot = slots.find((slot) => slot.id === addMemberTarget?.slotId);
  const movingSlot = moveMember ? slots.find((slot) => slot.members.some((member) => member.id === moveMember.id)) : undefined;
  const businessDialogOpen = Boolean(editSlotId) || Boolean(addMemberTarget) || Boolean(editMember) || Boolean(renewMember) || Boolean(moveMember);
  useEffect(() => {
    const closeMenus = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest("details.action-menu")) closeOpenActionMenus();
    };
    document.addEventListener("pointerdown", closeMenus);
    return () => document.removeEventListener("pointerdown", closeMenus);
  }, []);
  const filtered = useMemo(() => slots.filter((slot) => {
    const active = slot.members.filter((m) => m.status === "ACTIVE").length;
    const status = slotStatus(slot.capacity, active, slot.status);
    return (statusFilter === "all" || status === statusFilter) && `${slot.slotNumber} ${slot.accountEmail} ${slot.platform.name} ${slot.members.map((m) => `${m.nickname} ${m.contact}`).join(" ")}`.toLowerCase().includes(query.toLowerCase());
  }), [slots, query, statusFilter]);
  const events = slots.flatMap((slot) => slot.members.filter((m) => m.status === "ACTIVE").map((member) => ({ slot, member, date: new Date(member.expireDate) })));
  const calendarDays = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) });
  const exportHref = `/api/export/slots?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(statusFilter !== "all" ? { status: statusFilter } : {}), ...(platformSlug ? { platform: platformSlug } : {}) }).toString()}`;
  return <>
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3"><div className="flex items-center gap-3"><strong className="text-[15px]">车位列表 <span className="font-normal text-[var(--muted-foreground)]">({filtered.length})</span></strong><div className="flex rounded-[6px] border border-[var(--border)] bg-[#fafbfc] p-0.5">{viewOptions.map(({ value, icon: Icon, label }) => <button key={value} onClick={() => setView(value)} className={cn("flex min-h-8 items-center gap-1.5 rounded-[4px] px-2.5 text-[12px] text-[#657080]", view === value && "bg-white text-[#2457bd] shadow-sm")}><Icon size={14} />{label}</button>)}</div></div><button className="btn btn-primary" onClick={() => setNewSlot(true)}><Plus size={16} />新增车位</button></div>
      <div className="toolbar border-b border-[var(--border)] px-4 py-3"><div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface)] px-3 transition-[border-color,box-shadow] focus-within:border-[#8ab9d4] focus-within:shadow-[0_0_0_3px_rgb(0_97_153/10%)]"><Search size={15} className="shrink-0 text-[#7b8493]" /><input aria-label="搜索账号、编号或车友" name="slot-filter-query" type="search" autoComplete="off" autoCapitalize="none" spellCheck={false} data-1p-ignore data-lpignore="true" value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 min-w-0 flex-1 appearance-none bg-transparent outline-none focus-visible:outline-none" placeholder="搜索账号、编号、车友..." /></div><select aria-label="账号使用状态" className="select w-auto min-w-[120px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">全部状态</option>{["满", "缺1", "缺2", "缺3", "缺4", "空闲", "暂停", "异常"].map((s) => <option key={s}>{s}</option>)}</select><a className="btn" href={exportHref}><Clipboard size={15} />导出</a></div>
      {view === "table" && <div className="data-wrap"><table className="data-table"><thead><tr><th>编号</th>{!singlePlatform && <th>平台</th>}<th>登录账号</th><th>密码</th><th>状态</th><th>成员席位</th><th>平台续费日</th><th>卡尾号</th><th>最近到期</th><th>备注</th><th aria-label="管理账号"></th></tr></thead><tbody>{filtered.map((slot) => { const active = slot.members.filter((m) => m.status === "ACTIVE"); const status = slotStatus(slot.capacity, active.length, slot.status); const next = active.toSorted((a, b) => +new Date(a.expireDate) - +new Date(b.expireDate))[0]; return <tr key={slot.id} onClick={() => viewSlotDetails(slot.id)} className="cursor-pointer"><td className="font-semibold tabular">{slot.slotNumber}</td>{!singlePlatform && <td><span className="flex items-center gap-2"><PlatformIcon slug={slot.platform.slug} name={slot.platform.name} icon={slot.platform.icon} size={16} className="border border-[#edf0f3]" />{slot.platform.name}</span></td>}<td className="text-[#2457bd]">{slot.accountEmail}</td><td onClick={(event) => event.stopPropagation()}><PasswordCell slotId={slot.id} /></td><td><Badge tone={toneForSlot(status)}>{status}</Badge></td><td><SeatButtons slot={slot} members={active} onMember={(member) => editMemberInSlot(slot.id, member)} onEmpty={(seatNumber) => addMemberToSlot(slot.id, seatNumber)} /></td><td className="whitespace-nowrap">每月 {slot.billingDay} 日</td><td className="tabular">{slot.cardLast4 || "-"}</td><td>{next ? <div className="flex items-center gap-2 whitespace-nowrap"><span className="tabular">{format(new Date(next.expireDate), "yyyy.MM.dd")}</span><Expiry value={next.expireDate} /></div> : "-"}</td><td className="max-w-[150px] truncate text-[var(--muted-foreground)]" title={slot.note || undefined}>{slot.note || "-"}</td><td onClick={(event) => event.stopPropagation()}><button type="button" className="row-action-trigger" aria-label={`管理账号 ${slot.slotNumber}`} title="查看并管理账号" onClick={() => viewSlotDetails(slot.id)}><Pencil size={16} /></button></td></tr>; })}</tbody></table>{!filtered.length && <div className="empty">没有符合条件的合租车位</div>}</div>}
      {view === "board" && <div className="grid min-h-[520px] auto-cols-[260px] grid-flow-col gap-3 overflow-x-auto bg-[#fafbfc] p-4">{["满", "缺1", "缺2", "缺3", "缺4", "空闲", "暂停", "异常"].map((group) => { const groupSlots = filtered.filter((slot) => slotStatus(slot.capacity, slot.members.filter((m) => m.status === "ACTIVE").length, slot.status) === group); return <section key={group} className="w-[260px]"><div className="mb-2 flex items-center justify-between px-1"><Badge tone={toneForSlot(group)}>{group}</Badge><span className="text-[12px] text-[var(--muted-foreground)]">{groupSlots.length}</span></div><div className="space-y-2">{groupSlots.map((slot) => { const active = slot.members.filter((m) => m.status === "ACTIVE"); const next = active.toSorted((a, b) => +new Date(a.expireDate) - +new Date(b.expireDate))[0]; return <button key={slot.id} onClick={() => setSelectedId(slot.id)} className="panel w-full p-3 text-left transition-colors hover:border-[#aab9d1]"><div className="flex items-center justify-between"><strong>{slot.platform.name} #{slot.slotNumber}</strong><span className="text-[12px] tabular text-[var(--muted-foreground)]">{active.length}/{slot.capacity}</span></div><p className="mt-2 truncate text-[12px] text-[#2457bd]">{slot.accountEmail}</p><p className="mt-3 text-[11px] text-[var(--muted-foreground)]">最近到期：{next ? format(new Date(next.expireDate), "MM.dd") : "-"}</p></button>; })}</div></section>; })}</div>}
      {view === "calendar" && <div className="p-4"><div className="mb-3 flex items-center justify-between"><button className="btn icon-btn" onClick={() => setMonth(subMonths(month, 1))} aria-label="上个月"><ChevronLeft size={16} /></button><strong>{format(month, "yyyy 年 M 月", { locale: zhCN })}</strong><button className="btn icon-btn" onClick={() => setMonth(addMonths(month, 1))} aria-label="下个月"><ChevronRight size={16} /></button></div><div className="grid grid-cols-7 border-l border-t border-[var(--border)]">{["一", "二", "三", "四", "五", "六", "日"].map((day) => <div key={day} className="border-b border-r border-[var(--border)] bg-[#fafbfc] p-2 text-center text-[11px] text-[var(--muted-foreground)]">{day}</div>)}{calendarDays.map((day) => { const dayEvents = events.filter((event) => isSameDay(event.date, day)); return <div key={day.toISOString()} className={cn("min-h-[110px] border-b border-r border-[var(--border)] p-1.5", !isSameMonth(day, month) && "bg-[#fafbfc] text-[#a2a9b5]")}><div className="mb-1 text-[11px] tabular">{format(day, "d")}</div><div className="space-y-1">{dayEvents.slice(0, 3).map(({ slot, member }) => <button key={member.id} onClick={() => setSelectedId(slot.id)} className="block w-full truncate rounded-[4px] bg-[#eef4ff] px-1.5 py-1 text-left text-[10px] text-[#2457bd]">{slot.platform.name} #{slot.slotNumber} · {member.nickname}</button>)}{dayEvents.length > 3 && <span className="px-1 text-[10px] text-[var(--muted-foreground)]">+{dayEvents.length - 3} 条</span>}</div></div>; })}</div></div>}
    </div>
    {selected && !businessDialogOpen && <SlotDrawer slot={selected} focusedMemberId={focusedMemberId} close={closeSelected} addMember={() => addMemberToSlot(selected.id)} editSlot={() => editSelectedSlot(selected.id)} editMember={(member) => { closeBusinessDialogs(); setEditMember(member); }} renew={(member) => { closeBusinessDialogs(); setRenewMember(member); }} move={(member) => { closeBusinessDialogs(); setMoveMember(member); }} canDelete={canDelete} />}
    <FormDialog open={newSlot} title="新增合租车位" description="录入平台登录信息，并按套餐设置成员席位" onClose={closeNewSlot}><NewSlotForm platforms={platforms} close={closeNewSlot} /></FormDialog>
    {editingSlot && <FormDialog open title={`编辑合租车位 · ${editingSlot.platform.name} #${editingSlot.slotNumber}`} description="留空密码字段即可保留原密码" onClose={() => setEditSlotId("")}><EditSlotForm slot={editingSlot} platforms={platforms} close={() => setEditSlotId("")} /></FormDialog>}
    {addingSlot && addMemberTarget && <FormDialog open title={`添加车友 · ${addingSlot.platform.name} #${addingSlot.slotNumber}`} description={addMemberTarget.seatNumber ? `席位 ${addMemberTarget.seatNumber} · 当前 ${addingSlot.members.filter((m) => m.status === "ACTIVE").length}/${addingSlot.capacity}` : `当前 ${addingSlot.members.filter((m) => m.status === "ACTIVE").length}/${addingSlot.capacity}`} onClose={() => setAddMemberTarget(null)}><AddMemberForm slot={addingSlot} seatNumber={addMemberTarget.seatNumber} close={() => setAddMemberTarget(null)} /></FormDialog>}
    {editMember && <FormDialog open title={`编辑车友 · ${editMember.nickname}`} description="修改基础信息不会覆盖续费历史" onClose={() => setEditMember(null)}><EditMemberForm member={editMember} close={() => setEditMember(null)} /></FormDialog>}
    {renewMember && <FormDialog open title="续费" description="确认后将保留原到期时间并新增历史记录" onClose={() => setRenewMember(null)}><RenewalForm member={renewMember} close={() => setRenewMember(null)} /></FormDialog>}
    {moveMember && movingSlot && <FormDialog open title={`更换席位 · ${moveMember.nickname}`} description={`可在当前 ${movingSlot.platform.name} 账号内调整席位，也可与其他账号的成员互换`} onClose={() => setMoveMember(null)}><MoveMemberForm member={moveMember} currentSlot={movingSlot} slots={slots} close={() => setMoveMember(null)} /></FormDialog>}
  </>;
}
