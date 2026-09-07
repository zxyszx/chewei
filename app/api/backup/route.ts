import { cookies } from "next/headers";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { backupFilename, createBackupBody } from "@/lib/backup-data";
import { BackupValidationError, parseAndValidateBackup } from "@/lib/backup-schema";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  if (!host || new URL(origin).host !== host) throw new Error("请求来源无效");
}

export async function GET() {
  await requireAdmin();
  const body = await createBackupBody();
  return new Response(body, { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="${backupFilename()}"`, "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  await requireAdmin();
  try {
    assertSameOrigin(request);
    const form = await request.formData();
    const file = form.get("backup");
    if (!(file instanceof File)) return Response.json({ error: "请选择备份文件" }, { status: 400 });
    if (file.size > 25 * 1024 * 1024) return Response.json({ error: "备份文件不能超过 25 MB" }, { status: 413 });
    const data = parseAndValidateBackup(await file.text());

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
    const message = error instanceof SyntaxError ? "备份不是有效的 JSON 文件" : error instanceof BackupValidationError || error instanceof Error && error.message === "请求来源无效" ? error.message : "恢复失败，事务已回滚，原数据未改变";
    return Response.json({ error: message }, { status: error instanceof BackupValidationError ? error.status : 400 });
  }
}
