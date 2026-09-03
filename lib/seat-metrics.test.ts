import { describe, expect, it } from "vitest";
import { seatMetrics } from "./seat-metrics";

describe("seatMetrics", () => {
  it("counts available seats rather than accounts with vacancies", () => {
    const result = seatMetrics([
      { status: "ACTIVE", capacity: 5, members: [{ status: "ACTIVE" }, { status: "ACTIVE" }] },
      { status: "ACTIVE", capacity: 6, members: [{ status: "ACTIVE" }] },
    ]);
    expect(result.remaining).toBe(8);
    expect(result.occupied).toBe(3);
    expect(result.capacity).toBe(11);
  });

  it("excludes paused and abnormal accounts from allocatable capacity", () => {
    const result = seatMetrics([
      { status: "ACTIVE", capacity: 5, members: [{ status: "ACTIVE" }, { status: "EXITED" }] },
      { status: "PAUSED", capacity: 8, members: [{ status: "ACTIVE" }] },
      { status: "ABNORMAL", capacity: 4, members: [] },
    ]);
    expect(result.capacity).toBe(5);
    expect(result.occupied).toBe(1);
    expect(result.remaining).toBe(4);
  });
});
