import { describe, expect, it } from "vitest";
import { firstAvailableSeat } from "./slots";

describe("firstAvailableSeat", () => {
  it("returns the first gap instead of appending after occupied seats", () => {
    expect(firstAvailableSeat(5, [1, 3, 4])).toBe(2);
  });

  it("ignores historical null seats and reports a full slot", () => {
    expect(firstAvailableSeat(2, [null, 1])).toBe(2);
    expect(firstAvailableSeat(2, [1, 2])).toBeNull();
  });
});
