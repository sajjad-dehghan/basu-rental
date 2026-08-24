import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  daysInJalaliMonth,
  jalaliDateTimeFromIso,
  jalaliDateTimeToIso,
  jalaliMonthStartOffset,
  toGregorian,
  toJalali,
} from "../app/lib/jalali.ts";

describe("تقویم شمسی رزرو", () => {
  it("تبدیل رفت و برگشت تاریخ شمسی و میلادی را دقیق انجام می‌دهد", () => {
    assert.deepEqual(toJalali(2026, 8, 24), {
      year: 1405,
      month: 6,
      day: 2,
    });
    assert.deepEqual(toGregorian(1405, 6, 2), {
      year: 2026,
      month: 8,
      day: 24,
    });
  });

  it("سال کبیسه و طول اسفند را رعایت می‌کند", () => {
    assert.equal(daysInJalaliMonth(1403, 12), 30);
    assert.equal(daysInJalaliMonth(1404, 12), 29);
    assert.deepEqual(toJalali(2025, 3, 20), {
      year: 1403,
      month: 12,
      day: 30,
    });
  });

  it("ساعت تهران را با آفست صحیح در ISO ذخیره و بازیابی می‌کند", () => {
    const iso = jalaliDateTimeToIso(1405, 6, 2, 18, 30);
    assert.equal(iso, "2026-08-24T15:00:00.000Z");
    assert.deepEqual(jalaliDateTimeFromIso(iso), {
      year: 1405,
      month: 6,
      day: 2,
      hour: 18,
      minute: 30,
    });
  });

  it("شروع ماه را بر مبنای شنبه محاسبه می‌کند", () => {
    assert.equal(jalaliMonthStartOffset(1405, 6), 1);
  });
});
