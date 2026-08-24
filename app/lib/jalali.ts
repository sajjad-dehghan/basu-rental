export type JalaliDate = { year: number; month: number; day: number };
export type GregorianDate = { year: number; month: number; day: number };
export type JalaliDateTime = JalaliDate & { hour: number; minute: number };

export const TEHRAN_TIME_ZONE = "Asia/Tehran";
export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;
export const PERSIAN_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060,
  2097, 2192, 2262, 2324, 2394, 2456, 3178,
];

function div(a: number, b: number): number {
  return Math.trunc(a / b);
}

function mod(a: number, b: number): number {
  return a - Math.trunc(a / b) * b;
}

function jalaliCalendar(year: number, includeLeap = true) {
  const end = BREAKS.length;
  const gregorianYear = year + 621;
  let leapJ = -14;
  let previous = BREAKS[0];
  let current = 0;
  let jump = 0;

  if (year < previous || year >= BREAKS[end - 1]) {
    throw new Error("سال شمسی خارج از بازه پشتیبانی است.");
  }

  for (let index = 1; index < end; index += 1) {
    current = BREAKS[index];
    jump = current - previous;
    if (year < current) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    previous = current;
  }

  let distance = year - previous;
  leapJ += div(distance, 33) * 8 + div(mod(distance, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - distance === 4) leapJ += 1;

  const leapG =
    div(gregorianYear, 4) -
    div((div(gregorianYear, 100) + 1) * 3, 4) -
    150;
  const march = 20 + leapJ - leapG;
  if (!includeLeap) return { gregorianYear, march, leap: 0 };

  if (jump - distance < 6) {
    distance = distance - jump + div(jump + 4, 33) * 33;
  }
  let leap = mod(mod(distance + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { gregorianYear, march, leap };
}

function gregorianToDayNumber(year: number, month: number, day: number) {
  let value =
    div((year + div(month - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(month + 9, 12) + 2, 5) +
    day -
    34840408;
  value =
    value -
    div(div(year + 100100 + div(month - 8, 6), 100) * 3, 4) +
    752;
  return value;
}

function dayNumberToGregorian(dayNumber: number): GregorianDate {
  let value = 4 * dayNumber + 139361631;
  value =
    value +
    div(div(4 * dayNumber + 183187720, 146097) * 3, 4) * 4 -
    3908;
  const intermediate = div(mod(value, 1461), 4) * 5 + 308;
  const day = div(mod(intermediate, 153), 5) + 1;
  const month = mod(div(intermediate, 153), 12) + 1;
  const year = div(value, 1461) - 100100 + div(8 - month, 6);
  return { year, month, day };
}

function jalaliToDayNumber(year: number, month: number, day: number) {
  const calendar = jalaliCalendar(year, false);
  return (
    gregorianToDayNumber(calendar.gregorianYear, 3, calendar.march) +
    (month - 1) * 31 -
    div(month, 7) * (month - 7) +
    day -
    1
  );
}

export function toGregorian(year: number, month: number, day: number): GregorianDate {
  if (month < 1 || month > 12 || day < 1 || day > daysInJalaliMonth(year, month)) {
    throw new Error("تاریخ شمسی معتبر نیست.");
  }
  return dayNumberToGregorian(jalaliToDayNumber(year, month, day));
}

export function toJalali(year: number, month: number, day: number): JalaliDate {
  const dayNumber = gregorianToDayNumber(year, month, day);
  const gregorian = dayNumberToGregorian(dayNumber);
  let jalaliYear = gregorian.year - 621;
  const calendar = jalaliCalendar(jalaliYear);
  const firstFarvardin = gregorianToDayNumber(
    gregorian.year,
    3,
    calendar.march,
  );
  let offset = dayNumber - firstFarvardin;

  if (offset >= 0) {
    if (offset <= 185) {
      return {
        year: jalaliYear,
        month: 1 + div(offset, 31),
        day: mod(offset, 31) + 1,
      };
    }
    offset -= 186;
  } else {
    jalaliYear -= 1;
    offset += 179;
    if (calendar.leap === 1) offset += 1;
  }

  return {
    year: jalaliYear,
    month: 7 + div(offset, 30),
    day: mod(offset, 30) + 1,
  };
}

export function isJalaliLeapYear(year: number): boolean {
  return jalaliCalendar(year).leap === 0;
}

export function daysInJalaliMonth(year: number, month: number): number {
  if (month < 1 || month > 12) throw new Error("ماه شمسی معتبر نیست.");
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isJalaliLeapYear(year) ? 30 : 29;
}

export function jalaliDateTimeFromIso(value: string | Date): JalaliDateTime {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error("زمان معتبر نیست.");
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    timeZone: TEHRAN_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function jalaliDateTimeToIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string {
  const gregorian = toGregorian(year, month, day);
  const pad = (value: number) => String(value).padStart(2, "0");
  return new Date(
    `${gregorian.year}-${pad(gregorian.month)}-${pad(gregorian.day)}T${pad(hour)}:${pad(minute)}:00+03:30`,
  ).toISOString();
}

export function formatJalaliDateTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) return "زمان نامعتبر";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: TEHRAN_TIME_ZONE,
    calendar: "persian",
    ...options,
  }).format(date);
}

export function jalaliMonthOffset(
  year: number,
  month: number,
  amount: number,
): { year: number; month: number } {
  const index = year * 12 + (month - 1) + amount;
  return { year: Math.floor(index / 12), month: mod(index, 12) + 1 };
}

export function jalaliMonthStartOffset(year: number, month: number): number {
  const first = toGregorian(year, month, 1);
  const weekday = new Date(
    Date.UTC(first.year, first.month - 1, first.day),
  ).getUTCDay();
  return (weekday + 1) % 7;
}
