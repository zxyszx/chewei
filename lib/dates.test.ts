import { describe, expect, it } from "vitest";
import { expiryLabel, slotStatus } from "./dates";

describe("slotStatus", () => {
  it("derives occupancy instead of accepting a manual label", () => {
    expect(slotStatus(5, 5)).toBe("满");
    expect(slotStatus(5, 4)).toBe("缺1");
    expect(slotStatus(5, 1)).toBe("缺4");
    expect(slotStatus(5, 0)).toBe("空闲");
  });

  it("keeps explicit operational exceptions", () => {
    expect(slotStatus(5, 5, "PAUSED")).toBe("暂停");
    expect(slotStatus(5, 2, "ABNORMAL")).toBe("异常");
  });
});

describe("expiryLabel", () => {
  const now = new Date("2026-08-20T12:00:00+08:00");

  it("groups dates by urgency", () => {
    expect(expiryLabel(new Date("2026-08-19T00:00:00+08:00"), now).text).toBe("已过期 1 天");
    expect(expiryLabel(new Date("2026-08-20T00:00:00+08:00"), now).text).toBe("今天到期");
    expect(expiryLabel(new Date("2026-08-23T00:00:00+08:00"), now).tone).toBe("urgent");
    expect(expiryLabel(new Date("2026-08-27T00:00:00+08:00"), now).tone).toBe("warning");
    expect(expiryLabel(new Date("2026-09-19T00:00:00+08:00"), now).tone).toBe("notice");
  });
});
