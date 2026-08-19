"use server";

import { addMonths } from "date-fns";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSession, destroySession, requireAdmin, requireUser } from "@/lib/auth";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export type ActionState = { ok: boolean; message: string; data?: Record<string, string> };
const initialError: ActionState = { ok: false, message: "提交内容有误，请检查后重试" };
const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

async function log(userId: string, action: string, resourceType: string, resourceId?: string, detail?: object) {
  await prisma.operationLog.create({ data: { userId, action, resourceType, resourceId, detail, ip: await clientIp() } });
}

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({ username: z.string().min(1), password: z.string().min(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return initialError;
  try {
    if (!(await createSession(parsed.data.username, parsed.data.password))) return { ok: false, message: "用户名或密码不正确" };
  } catch {
    return { ok: false, message: "暂时无法连接数据库，请稍后重试" };
  }
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const slotSchema = z.object({
  platformId: z.string().min(1),
  slotNumber: z.coerce.number().int().positive(),
  accountEmail: z.string().email(),
  password: z.string().min(6),
  cardLast4: z.string().regex(/^\d{4}$/).or(z.literal("")),
  billingDay: z.coerce.number().int().min(1).max(31),
  capacity: z.coerce.number().int().min(1).max(99),
  note: z.string().max(2000).optional(),
});

export async function createSlotAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = slotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || initialError.message };
  try {
    const { password, ...slotData } = parsed.data;
    const slot = await prisma.parkingSlot.create({ data: { ...slotData, cardLast4: slotData.cardLast4 || null, encryptedPassword: encryptSecret(password) } });
    await log(user.id, "CREATE_SLOT", "parking_slot", slot.id, { slotNumber: slot.slotNumber, email: slot.accountEmail });
    revalidatePath("/");
    return { ok: true, message: `车位 #${slot.slotNumber} 保存成功` };
  } catch {
    return { ok: false, message: "车号或账号已存在，请检查后重试" };
  }
}

const memberSchema = z.object({
  slotId: z.string().min(1), nickname: z.string().min(1).max(80), contact: z.string().min(1).max(160),
  startDate: z.string().date(), expireDate: z.string().date(), note: z.string().max(2000).optional(),
});

export async function addMemberAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || initialError.message };
  try {
    const member = await prisma.$transaction(async (tx) => {
      const slot = await tx.parkingSlot.findUniqueOrThrow({ where: { id: parsed.data.slotId }, include: { _count: { select: { members: { where: { status: "ACTIVE" } } } } } });
      if (slot._count.members >= slot.capacity) throw new Error(`当前车位已满 ${slot._count.members}/${slot.capacity}`);
      return tx.member.create({ data: { ...parsed.data, startDate: date(parsed.data.startDate), expireDate: date(parsed.data.expireDate) } });
    }, { isolationLevel: "Serializable" });
    await log(user.id, "ADD_MEMBER", "member", member.id, { nickname: member.nickname, slotId: member.slotId });
    revalidatePath("/");
    return { ok: true, message: "添加车友成功" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "添加失败" };
  }
}

const renewSchema = z.object({
  memberId: z.string().min(1), months: z.coerce.number().int().min(0).max(120), newExpireDate: z.string().optional(),
  amount: z.coerce.number().min(0), paymentMethod: z.enum(["WECHAT", "ALIPAY", "CARD", "CASH", "OTHER"]), note: z.string().max(2000).optional(),
});

export async function renewMemberAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = renewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || initialError.message };
  try {
    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUniqueOrThrow({ where: { id: parsed.data.memberId } });
      const next = parsed.data.months === 0 && parsed.data.newExpireDate ? date(parsed.data.newExpireDate) : addMonths(member.expireDate, parsed.data.months);
      await tx.member.update({ where: { id: member.id }, data: { expireDate: next, status: "ACTIVE" } });
      await tx.renewal.create({ data: { memberId: member.id, slotId: member.slotId, oldExpireDate: member.expireDate, newExpireDate: next, months: parsed.data.months || null, amount: parsed.data.amount, paymentMethod: parsed.data.paymentMethod, note: parsed.data.note, operatorId: user.id } });
      return { member, next };
    });
    await log(user.id, "RENEW_MEMBER", "member", result.member.id, { oldDate: result.member.expireDate, newDate: result.next, amount: parsed.data.amount });
    revalidatePath("/");
    return { ok: true, message: `续费成功，新到期时间 ${result.next.toISOString().slice(0, 10)}` };
  } catch {
    return { ok: false, message: "续费失败，请刷新后重试" };
  }
}

export async function exitMemberAction(memberId: string): Promise<ActionState> {
  const user = await requireUser();
  const member = await prisma.member.update({ where: { id: memberId }, data: { status: "EXITED" } });
  await log(user.id, "EXIT_MEMBER", "member", member.id, { nickname: member.nickname });
  revalidatePath("/");
  return { ok: true, message: `${member.nickname} 已标记退出` };
}

export async function moveMemberAction(memberId: string, targetSlotId: string): Promise<ActionState> {
  const user = await requireUser();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUniqueOrThrow({ where: { id: memberId } });
      const target = await tx.parkingSlot.findUniqueOrThrow({ where: { id: targetSlotId }, include: { _count: { select: { members: { where: { status: "ACTIVE" } } } } } });
      if (target._count.members >= target.capacity) throw new Error("目标车位已满");
      await tx.member.update({ where: { id: memberId }, data: { slotId: targetSlotId } });
      return { member, target };
    }, { isolationLevel: "Serializable" });
    await log(user.id, "MOVE_MEMBER", "member", memberId, { from: result.member.slotId, to: targetSlotId });
    revalidatePath("/");
    return { ok: true, message: `已换至车位 #${result.target.slotNumber}` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "换位失败" };
  }
}

export async function moveMemberFormAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({ memberId: z.string().min(1), targetSlotId: z.string().min(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "请选择目标车位" };
  return moveMemberAction(parsed.data.memberId, parsed.data.targetSlotId);
}

export async function revealPasswordAction(slotId: string): Promise<ActionState> {
  const user = await requireUser();
  const slot = await prisma.parkingSlot.findUniqueOrThrow({ where: { id: slotId } });
  await log(user.id, "VIEW_PASSWORD", "parking_slot", slot.id, { email: slot.accountEmail });
  return { ok: true, message: "密码已显示，此操作已记录", data: { password: decryptSecret(slot.encryptedPassword) } };
}

export async function updateRemindersAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireAdmin();
  const values = String(formData.get("days") || "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0 && n <= 365);
  if (!values.length) return { ok: false, message: "请输入有效提醒天数" };
  await prisma.setting.upsert({ where: { key: "reminderDays" }, update: { value: values }, create: { key: "reminderDays", value: values } });
  await log(user.id, "UPDATE_SETTINGS", "setting", "reminderDays", { values });
  revalidatePath("/settings");
  return { ok: true, message: "提醒设置已保存" };
}

export async function updatePlatformAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireAdmin();
  const parsed = z.object({ platformId: z.string().min(1), defaultCapacity: z.coerce.number().int().min(1).max(99) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "平台容量必须在 1 到 99 之间" };
  const platform = await prisma.platform.update({ where: { id: parsed.data.platformId }, data: { defaultCapacity: parsed.data.defaultCapacity } });
  await log(user.id, "UPDATE_PLATFORM", "platform", platform.id, { defaultCapacity: platform.defaultCapacity });
  revalidatePath("/settings");
  return { ok: true, message: `${platform.name} 默认容量已更新` };
}
