import { z } from "zod";
import { encryptionKeyFingerprint } from "./crypto";

const date = z.string().datetime();
const status = z.enum(["ACTIVE", "PAUSED", "ABNORMAL", "EXITED"]);

export const backupSchema = z.object({
  version: z.literal(3),
  exportedAt: date,
  encryptionKeyFingerprint: z.string().length(16),
  platforms: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string(), icon: z.string().nullable(), defaultCapacity: z.number().int(), status, createdAt: date, updatedAt: date })),
  slots: z.array(z.object({ id: z.string(), platformId: z.string(), slotNumber: z.number().int(), accountEmail: z.string(), encryptedPassword: z.string(), cardLast4: z.string().nullable(), billingDay: z.number().int(), capacity: z.number().int(), status, note: z.string().nullable(), createdAt: date, updatedAt: date })),
  members: z.array(z.object({ id: z.string(), slotId: z.string(), nickname: z.string(), contact: z.string(), contactType: z.string(), startDate: date, expireDate: date, status, seatNumber: z.number().int().nullable(), note: z.string().nullable(), createdAt: date, updatedAt: date })),
  renewals: z.array(z.object({ id: z.string(), memberId: z.string(), slotId: z.string(), oldExpireDate: date, newExpireDate: date, months: z.number().int().nullable(), amount: z.string(), paymentMethod: z.enum(["WECHAT", "ALIPAY", "CRYPTO", "CARD", "CASH", "OTHER"]), note: z.string().nullable(), operatorId: z.string(), createdAt: date })),
  users: z.array(z.object({ id: z.string(), username: z.string(), passwordHash: z.string(), role: z.enum(["ADMIN", "OPERATOR"]), status, createdAt: date, updatedAt: date })),
  operationLogs: z.array(z.object({ id: z.string(), userId: z.string(), action: z.string(), resourceType: z.string(), resourceId: z.string().nullable(), detail: z.unknown().nullable(), ip: z.string().nullable(), createdAt: date })),
  settings: z.array(z.object({ key: z.string(), value: z.unknown(), updatedAt: date })),
});

export class BackupValidationError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "BackupValidationError";
  }
}

export function parseAndValidateBackup(body: string) {
  const parsed = backupSchema.safeParse(JSON.parse(body));
  if (!parsed.success) throw new BackupValidationError("备份格式不正确，仅支持当前 v3 备份");
  if (parsed.data.encryptionKeyFingerprint !== encryptionKeyFingerprint()) {
    throw new BackupValidationError("备份与当前 ENCRYPTION_KEY 不匹配，平台密码将无法解密", 409);
  }
  if (!parsed.data.users.some((user) => user.role === "ADMIN" && user.status === "ACTIVE")) {
    throw new BackupValidationError("备份中没有可用的管理员账号");
  }
  return parsed.data;
}
