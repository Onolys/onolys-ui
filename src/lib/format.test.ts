import { describe, expect, it } from "vitest";
import { formatResetTime } from "./format";

describe("formatResetTime", () => {
  it("includes the time zone so a bare clock time is not ambiguous (E23)", () => {
    const out = formatResetTime("2026-11-22T09:00:00Z") ?? "";
    expect(out).toMatch(/\d{1,2}:\d{2}/);
    expect(out).toMatch(/[A-Za-z]{2,}|GMT|UTC|[+-]\d/); // a zone name or offset after the time
    expect(out.replace(/^\d{1,2}:\d{2}\s?(AM|PM)?/i, "").trim()).not.toBe("");
  });
});

describe("formatDate (C14)", () => {
  it("uses the given locale and zone, one shared format", async () => {
    const { formatDate } = await import("./format");
    expect(formatDate("2026-11-24T23:30:00.000Z", { locale: "en-US", timeZone: "UTC" })).toBe("Nov 24, 2026");
    expect(formatDate("2026-11-24T23:30:00.000Z", { locale: "en-US", timeZone: "Asia/Tokyo" })).toBe("Nov 25, 2026");
  });
  it("returns the input when it is not a date", async () => {
    const { formatDate } = await import("./format");
    expect(formatDate("garbage")).toBe("garbage");
  });
});
