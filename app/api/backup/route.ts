import { z } from "zod";
import { cookies } from "next/headers";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { encryptionKeyFingerprint } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const date = z.string().datetime();
const status = z.enum(["ACTIVE", "PAUSED", "ABNORMAL", "EXITED"]);
const backupSchema = z.object({
  version: z.literal(3),
  encryptionKeyFingerprint: z.string().length(16),
  platforms: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string(), icon: z.string().nullable(), defaultCapacity: z.number().int(), status, createdAt: date, updatedAt: date })),
  slots: z.array(z.object({ id: z.string(), platformId: z.string(), slotNumber: z.number().int(), accountEmail: z.string(), encryptedPassword: z.string(), cardLast4: z.string().nullable(), billingDay: z.number().int(), capacity: z.number().int(), status, note: z.string().nullable(), createdAt: date, updatedAt: date })),
  members: z.array(z.object({ id: z.string(), slotId: z.string(), nickname: z.string(), contact: z.string(), contactType: z.string(), startDate: date, expireDate: date, status, seatNumber: z.number().int().nullable(), note: z.string().nullable(), createdAt: date, updatedAt: date })),
  renewals: z.array(z.object({ id: z.string(), memberId: z.string(), slotId: z.string(), oldExpireDate: date, newExpireDate: date, months: z.number().int().nullable(), amount: z.string(), paymentMethod: z.enum(["WECHAT", "ALIPAY", "CRYPTO", "CARD", "CASH", "OTHER"]), note: z.string().nullable(), operatorId: z.string(), createdAt: date })),
  users: z.array(z.object({ id: z.string(), username: z.string(), passwordHash: z.string(), role: z.enum(["ADMIN", "OPERATOR"]), status, createdAt: date, updatedAt: date })),
  operationLogs: z.array(z.object({ id: z.string(), userId: z.string(), action: z.string(), resourceType: z.string(), resourceId: z.string().nullable(), detail: z.unknown().nullable(), ip: z.string().nullable(), createdAt: date })),
  settings: z.array(z.object({ key: z.string(), value: z.unknown(), updatedAt: date })),
});

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  if (!host || new URL(origin).host !== host) throw new Error("请求来源无效");
}

export async function GET() {
  await requireAdmin();
  const [platforms, slots, members, renewals, operationLogs, users, settings] = await Promise.all([
    prisma.platform.findMany(), prisma.parkingSlot.findMany(), prisma.member.findMany(), prisma.renewal.findMany(), prisma.operationLog.findMany(), prisma.user.findMany(), prisma.setting.findMany(),
  ]);
  const body = JSON.stringify({ version: 3, exportedAt: new Date().toISOString(), encryptionKeyFingerprint: encryptionKeyFingerprint(), platforms, slots, members, renewals: renewals.map((r) => ({ ...r, amount: r.amount.toString() })), operationLogs, users, settings }, null, 2);
  return new Response(body, { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="parking-backup-${new Date().toISOString().slice(0, 10)}.json"` } });
}

export async function POST(request: Request) {
  await requireAdmin();
  try {
    assertSameOrigin(request);
    const form = await request.formData();
    const file = form.get("backup");
    if (!(file instanceof File)) return Response.json({ error: "请选择备份文件" }, { status: 400 });
    if (file.size > 25 * 1024 * 1024) return Response.json({ error: "备份文件不能超过 25 MB" }, { status: 413 });
    const parsed = backupSchema.safeParse(JSON.parse(await file.text()));
    if (!parsed.success) return Response.json({ error: "备份格式不正确，仅支持当前 v3 备份" }, { status: 400 });
    const data = parsed.data;
    if (data.encryptionKeyFingerprint !== encryptionKeyFingerprint()) return Response.json({ error: "备份与当前 ENCRYPTION_KEY 不匹配，恢复将导致账号密码无法解密" }, { status: 409 });
    if (!data.users.some((user) => user.role === "ADMIN" && user.status === "ACTIVE")) return Response.json({ error: "备份中没有可用的管理员账号" }, { status: 400 });

    const toDate = (value: string) => new Date(value);
    await prisma.$transaction(async (tx) => {
      await tx.operationLog.deleteMany(); await tx.session.deleteMany(); await tx.renewal.deleteMany(); await tx.member.deleteMany(); await tx.parkingSlot.deleteMany(); await tx.platform.deleteMany(); await tx.setting.deleteMany(); await tx.user.deleteMany();
      await tx.user.createMany({ data: data.users.map((v) => ({ ...v, createdAt: toDate(v.createdAt), updatedAt: toDate(v.updatedAt) })) });
      await tx.platform.createMany({ data: data.platforms.map((v) => ({ ...v, createdAt: toDate(v.createdAt), updatedAt: toDate(v.updatedAt) })) });
      await tx.parkingSlot.createMany({ data: data.slots.map((v) => ({ ...v, createdAt: toDate(v.createdAt), updatedAt: toDate(v.updatedAt) })) });
      await tx.member.createMany({ data: data.members.map((v) => ({ ...v, startDate: toDate(v.startDate), expireDate: toDate(v.expireDate), createdAt: toDate(v.createdAt), updatedAt: toDate(v.updatedAt) })) });
      await tx.renewal.createMany({ data: data.renewals.map((v) => ({ ...v, oldExpireDate: toDate(v.oldExpireDate), newExpireDate: toDate(v.newExpireDate), createdAt: toDate(v.createdAt) })) });
      await tx.setting.createMany({ data: data.settings.map((v) => ({ ...v, value: v.value === null ? Prisma.JsonNull : v.value as Prisma.InputJsonValue, updatedAt: toDate(v.updatedAt) })) });
      await tx.operationLog.createMany({ data: data.operationLogs.map((v) => ({ ...v, detail: v.detail === null ? Prisma.DbNull : v.detail as Prisma.InputJsonValue, createdAt: toDate(v.createdAt) })) });
    }, { timeout: 30_000 });
    (await cookies()).delete("parking_session");
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof SyntaxError ? "备份不是有效的 JSON 文件" : error instanceof Error && error.message === "请求来源无效" ? error.message : "恢复失败，事务已回滚，原数据未改变";
    return Response.json({ error: message }, { status: 400 });
  }
}
