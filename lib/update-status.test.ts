import { describe, expect, it } from "vitest";
import { resolveUpdateStatus } from "./update-status";

describe("resolveUpdateStatus", () => {
  it("finishes a stale running state when the deployed commit is current", () => {
    expect(resolveUpdateStatus(
      { state: "updating", message: "正在构建", updatedAt: "2026-09-14T10:00:00.000Z" },
      "abc123",
      "abc123",
    )).toMatchObject({ state: "success", message: "更新完成，当前已是最新版本" });
  });

  it("marks a running state as failed after one hour without progress", () => {
    expect(resolveUpdateStatus(
      { state: "queued", message: "等待处理", updatedAt: "2026-09-14T10:00:00.000Z" },
      "old",
      "new",
      Date.parse("2026-09-14T11:00:01.000Z"),
    )).toMatchObject({ state: "failed" });
  });

  it("keeps recent and terminal states unchanged", () => {
    const recent = { state: "updating", updatedAt: "2026-09-14T10:30:00.000Z" };
    const success = { state: "success", updatedAt: "2026-09-14T10:00:00.000Z" };
    expect(resolveUpdateStatus(recent, "old", "new", Date.parse("2026-09-14T11:00:00.000Z"))).toBe(recent);
    expect(resolveUpdateStatus(success, "new", "new")).toBe(success);
  });
});
