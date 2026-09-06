import { describe, expect, it } from "vitest";
import { backupFilename, validBackupFilename } from "./backup-filenames";

describe("backup filenames", () => {
  it("uses a sortable UTC timestamp", () => {
    expect(backupFilename(new Date("2026-09-06T01:02:03.456Z"))).toBe("chewei-backup-20260906T010203Z.json");
  });

  it("accepts generated names and rejects path traversal", () => {
    expect(validBackupFilename("chewei-backup-20260906T010203Z.json")).toBe(true);
    expect(validBackupFilename("../chewei-backup-20260906T010203Z.json")).toBe(false);
    expect(validBackupFilename("chewei-backup-20260906.json")).toBe(false);
  });
});
