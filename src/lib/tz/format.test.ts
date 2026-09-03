import { describe, expect, it } from "vitest";
import { formatInJobTimezone } from "./format";

describe("formatInJobTimezone", () => {
  it("renders the same instant correctly for a Central job and a Mountain job — Fast Stop spans both (FE-SPEC.md §9)", () => {
    const instant = "2026-01-15T20:00:00.000Z";

    // A Louisiana dispatcher (Central) looking at a Colorado job (Mountain)
    // must see Colorado's wall-clock time, not their own (FE-SPEC.md §14).
    expect(formatInJobTimezone(instant, "America/Denver")).toBe("Jan 15, 2026, 1:00 PM MST");
    expect(formatInJobTimezone(instant, "America/Chicago")).toBe("Jan 15, 2026, 2:00 PM CST");
  });

  it("crosses the US DST spring-forward boundary correctly in both zones", () => {
    const beforeSpringForward = "2026-03-01T18:00:00.000Z";
    const afterSpringForward = "2026-03-15T18:00:00.000Z";

    expect(formatInJobTimezone(beforeSpringForward, "America/Chicago")).toBe(
      "Mar 1, 2026, 12:00 PM CST",
    );
    expect(formatInJobTimezone(afterSpringForward, "America/Chicago")).toBe(
      "Mar 15, 2026, 1:00 PM CDT",
    );
    expect(formatInJobTimezone(beforeSpringForward, "America/Denver")).toBe(
      "Mar 1, 2026, 11:00 AM MST",
    );
    expect(formatInJobTimezone(afterSpringForward, "America/Denver")).toBe(
      "Mar 15, 2026, 12:00 PM MDT",
    );
  });

  it("accepts a Date instance as well as an ISO string", () => {
    const instant = new Date("2026-01-15T20:00:00.000Z");
    expect(formatInJobTimezone(instant, "America/Denver")).toBe("Jan 15, 2026, 1:00 PM MST");
  });

  it("can omit the year", () => {
    expect(
      formatInJobTimezone("2026-01-15T20:00:00.000Z", "America/Denver", { includeYear: false }),
    ).toBe("Jan 15, 1:00 PM MST");
  });

  it("throws on an invalid instant instead of silently formatting garbage", () => {
    expect(() => formatInJobTimezone("not-a-date", "America/Chicago")).toThrow();
  });
});
