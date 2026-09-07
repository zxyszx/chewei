import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { encryptionKeyFingerprint } from "./crypto";
import { BackupValidationError, parseAndValidateBackup } from "./backup-schema";

const originalKey = process.env.ENCRYPTION_KEY;
const now = "2026-09-07T04:00:00.000Z";

function backup(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    version: 3,
    exportedAt: now,
    encryptionKeyFingerprint: encryptionKeyFingerprint(),
    platforms: [],
    slots: [],
    members: [],
    renewals: [],
    operationLogs: [],
    settings: [],
    users: [{ id: "admin-1", username: "admin", passwordHash: "hash", role: "ADMIN", status: "ACTIVE", createdAt: now, updatedAt: now }],
    ...overrides,
  });
}

beforeAll(() => { process.env.ENCRYPTION_KEY = "1".repeat(64); });
afterAll(() => {
  if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
  else process.env.ENCRYPTION_KEY = originalKey;
});

describe("backup validation", () => {
  it("accepts a current backup with an active administrator", () => {
    expect(parseAndValidateBackup(backup()).version).toBe(3);
  });

  it("rejects a backup encrypted by another installation", () => {
    expect(() => parseAndValidateBackup(backup({ encryptionKeyFingerprint: "0".repeat(16) }))).toThrowError(BackupValidationError);
  });

  it("rejects malformed and unsupported backup data", () => {
    expect(() => parseAndValidateBackup(backup({ version: 2 }))).toThrow("备份格式不正确");
  });
});
