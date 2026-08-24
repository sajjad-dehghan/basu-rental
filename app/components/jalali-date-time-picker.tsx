"use client";

import { useState } from "react";
import {
  JALALI_MONTHS,
  PERSIAN_WEEKDAYS,
  daysInJalaliMonth,
  formatJalaliDateTime,
  jalaliDateTimeFromIso,
  jalaliDateTimeToIso,
  jalaliMonthOffset,
  jalaliMonthStartOffset,
} from "../lib/jalali";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minValue?: string;
};

function initialDraft(value: string) {
  const now = new Date();
  const parts = jalaliDateTimeFromIso(value || now);
  if (!value) {
    const roundedMinute = Math.ceil(parts.minute / 15) * 15;
    if (roundedMinute === 60) {
      const next = new Date(now.valueOf() + 60 * 60 * 1000);
      const nextParts = jalaliDateTimeFromIso(next);
      return { ...nextParts, minute: 0 };
    }
    return { ...parts, minute: roundedMinute };
  }
  return parts;
}

export function JalaliDateTimePicker({
  label,
  value,
  onChange,
  minValue,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => initialDraft(value));
  const [view, setView] = useState(() => {
    const initial = initialDraft(value);
    return { year: initial.year, month: initial.month };
  });

  const today = jalaliDateTimeFromIso(new Date());
  const offset = jalaliMonthStartOffset(view.year, view.month);
  const dayCount = daysInJalaliMonth(view.year, view.month);
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= dayCount ? day : null;
  });

  function showPicker() {
    const next = initialDraft(value);
    setDraft(next);
    setView({ year: next.year, month: next.month });
    setOpen(true);
  }

  function moveMonth(amount: number) {
    setView((current) =>
      jalaliMonthOffset(current.year, current.month, amount),
    );
  }

  function selectDay(day: number) {
    setDraft((current) => ({
      ...current,
      year: view.year,
      month: view.month,
      day,
    }));
  }

  function confirm() {
    const next = jalaliDateTimeToIso(
      draft.year,
      draft.month,
      draft.day,
      draft.hour,
      draft.minute,
    );
    if (minValue && Date.parse(next) < Date.parse(minValue)) return;
    onChange(next);
    setOpen(false);
  }

  const draftIso = jalaliDateTimeToIso(
    draft.year,
    draft.month,
    draft.day,
    draft.hour,
    draft.minute,
  );
  const beforeMinimum = Boolean(
    minValue && Date.parse(draftIso) < Date.parse(minValue),
  );

  return (
    <div className="jalali-field">
      <span className="jalali-field-label">{label}</span>
      <button
        type="button"
        className={value ? "jalali-trigger has-value" : "jalali-trigger"}
        onClick={() => (open ? setOpen(false) : showPicker())}
        aria-expanded={open}
      >
        <span>
          {value
            ? formatJalaliDateTime(value, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "انتخاب تاریخ و ساعت"}
        </span>
        <i aria-hidden="true">⌄</i>
      </button>
      {open && (
        <div className="jalali-popover" role="dialog" aria-label={label}>
          <div className="jalali-calendar-head">
            <button
              type="button"
              onClick={() => moveMonth(1)}
              aria-label="ماه بعد"
            >
              ‹
            </button>
            <strong>
              {JALALI_MONTHS[view.month - 1]} {view.year.toLocaleString("fa-IR", { useGrouping: false })}
            </strong>
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label="ماه قبل"
            >
              ›
            </button>
          </div>
          <div className="jalali-weekdays" aria-hidden="true">
            {PERSIAN_WEEKDAYS.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="jalali-days">
            {days.map((day, index) =>
              day === null ? (
                <span key={`empty-${index}`} />
              ) : (
                <button
                  type="button"
                  key={day}
                  className={[
                    draft.year === view.year &&
                    draft.month === view.month &&
                    draft.day === day
                      ? "selected"
                      : "",
                    today.year === view.year &&
                    today.month === view.month &&
                    today.day === day
                      ? "today"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-pressed={
                    draft.year === view.year &&
                    draft.month === view.month &&
                    draft.day === day
                  }
                  onClick={() => selectDay(day)}
                >
                  {day.toLocaleString("fa-IR")}
                </button>
              ),
            )}
          </div>
          <div className="jalali-time-row">
            <span>ساعت</span>
            <select
              aria-label="ساعت"
              value={draft.hour}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  hour: Number(event.target.value),
                }))
              }
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <option value={hour} key={hour}>
                  {hour.toLocaleString("fa-IR", {
                    minimumIntegerDigits: 2,
                    useGrouping: false,
                  })}
                </option>
              ))}
            </select>
            <b>:</b>
            <select
              aria-label="دقیقه"
              value={draft.minute}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  minute: Number(event.target.value),
                }))
              }
            >
              {Array.from({ length: 12 }, (_, index) => index * 5).map(
                (minute) => (
                  <option value={minute} key={minute}>
                    {minute.toLocaleString("fa-IR", {
                      minimumIntegerDigits: 2,
                      useGrouping: false,
                    })}
                  </option>
                ),
              )}
            </select>
          </div>
          {beforeMinimum && (
            <p className="jalali-error">این زمان باید بعد از زمان شروع باشد.</p>
          )}
          <div className="jalali-actions">
            <button type="button" onClick={() => setOpen(false)}>
              انصراف
            </button>
            <button type="button" onClick={confirm} disabled={beforeMinimum}>
              تأیید زمان
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
