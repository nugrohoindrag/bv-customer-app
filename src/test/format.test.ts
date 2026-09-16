import { describe, expect, it } from "vitest";
import { countdownParts, e164, localPhone, mmss, nightsBetween, rupiah, stayRange } from "@/lib/format";
import { ratingLabel } from "@/lib/rating";

describe("format", () => {
  it("rupiah", () => {
    expect(rupiah(2560000)).toBe("Rp 2.560.000");
    expect(rupiah(null)).toBe("-");
  });
  it("phone e164 ↔ lokal", () => {
    expect(e164("8123456789")).toBe("+628123456789");
    expect(e164("08123456789")).toBe("+628123456789");
    expect(e164("628123456789")).toBe("+628123456789");
    expect(localPhone("+628123456789")).toBe("8123456789");
  });
  it("nights & countdown", () => {
    expect(nightsBetween("2026-09-25", "2026-09-27")).toBe(2);
    expect(countdownParts(5 * 3600 * 1000)).toEqual({ h: 5, m: 0, s: 0 });
    expect(mmss(99)).toBe("1:39");
  });
  it("stayRange", () => {
    expect(stayRange("2026-09-25T14:00:00+07:00", "2026-09-26T12:00:00+07:00")).toMatch(/\d{2}:\d{2}, 25 Sep - \d{2}:\d{2}, 26 Sep 2026/);
  });
});

describe("rating label (sesuai server)", () => {
  it("label", () => {
    expect(ratingLabel(0, 0)).toBe("No Review Yet");
    expect(ratingLabel(2.1, 3)).toBe("Bad");
    expect(ratingLabel(3.7, 3)).toBe("Good");
    expect(ratingLabel(4.5, 3)).toBe("Very Good");
    expect(ratingLabel(4.9, 3)).toBe("Awesome");
  });
});
