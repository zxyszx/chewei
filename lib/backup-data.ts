import { encryptionKeyFingerprint } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
export { backupFilename, validBackupFilename } from "@/lib/backup-filenames";

export const backupDirectory = process.env.BACKUP_DIRECTORY || "/app/backups";

export async function createBackupBody() {
  const [platforms, slots, members, renewals, operationLogs, users, settings] = await Promise.all([
    prisma.platform.findMany(), prisma.parkingSlot.findMany(), prisma.member.findMany(), prisma.renewal.findMany(), prisma.operationLog.findMany(), prisma.user.findMany(), prisma.setting.findMany(),
  ]);
  return JSON.stringify({
    version: 3,
    exportedAt: new Date().toISOString(),
    encryptionKeyFingerprint: encryptionKeyFingerprint(),
    platforms,
    slots,
    members,
    renewals: renewals.map((renewal) => ({ ...renewal, amount: renewal.amount.toString() })),
    operationLogs,
    users,
    settings,
  }, null, 2);
}
