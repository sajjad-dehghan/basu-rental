"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  JALALI_MONTHS,
  PERSIAN_WEEKDAYS,
  daysInJalaliMonth,
  formatJalaliDateTime,
  jalaliDateTimeFromIso,
  jalaliMonthOffset,
  jalaliMonthStartOffset,
} from "../lib/jalali";

export type CalendarBooking = {
  id: string;
  reference: string;
  event_title: string;
  start_at: string;
  item_summary: string;
  reservation_status: string;
};

export function JalaliBookingCalendar({
  bookings,
}: {
  bookings: CalendarBooking[];
}) {
  const today = jalaliDateTimeFromIso(new Date());
  const [view, setView] = useState({ year: today.year, month: today.month });
  const dayCount = daysInJalaliMonth(view.year, view.month);
  const offset = jalaliMonthStartOffset(view.year, view.month);
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= dayCount ? day : null;
  });

  const bookingsByDay = useMemo(() => {
    const grouped = new Map<number, CalendarBooking[]>();
    for (const booking of bookings) {
      const parts = jalaliDateTimeFromIso(booking.start_at);
      if (parts.year !== view.year || parts.month !== view.month) continue;
      grouped.set(parts.day, [...(grouped.get(parts.day) ?? []), booking]);
    }
    for (const items of grouped.values()) {
      items.sort(
        (left, right) => Date.parse(left.start_at) - Date.parse(right.start_at),
      );
    }
    return grouped;
  }, [bookings, view]);

  function move(amount: number) {
    setView((current) =>
      jalaliMonthOffset(current.year, current.month, amount),
    );
  }

  return (
    <div className="calendar-board jalali-admin-calendar">
      <div className="calendar-toolbar">
        <div>
          <span className="summary-kicker">نمای ماهانه</span>
          <h2>
            {JALALI_MONTHS[view.month - 1]} {view.year.toLocaleString("fa-IR", { useGrouping: false })}
          </h2>
          <p>رزروها و زمان تحویل به وقت تهران</p>
        </div>
        <div className="calendar-controls">
          <button type="button" onClick={() => move(1)} aria-label="ماه بعد">
            ‹
          </button>
          <button
            type="button"
            className="calendar-today-button"
            onClick={() => setView({ year: today.year, month: today.month })}
          >
            امروز
          </button>
          <button type="button" onClick={() => move(-1)} aria-label="ماه قبل">
            ›
          </button>
        </div>
      </div>
      <div className="admin-calendar-scroll">
        <div className="admin-calendar-grid calendar-weekday-row">
          {PERSIAN_WEEKDAYS.map((weekday, index) => (
            <span key={`${weekday}-${index}`}>{weekday}</span>
          ))}
        </div>
        <div className="admin-calendar-grid calendar-month-grid">
          {days.map((day, index) => {
            const dayBookings = day === null ? [] : (bookingsByDay.get(day) ?? []);
            const isToday =
              day !== null &&
              today.year === view.year &&
              today.month === view.month &&
              today.day === day;
            return day === null ? (
              <div className="calendar-day muted" key={`empty-${index}`} />
            ) : (
              <div
                className={`calendar-day${isToday ? " today" : ""}${dayBookings.length ? " occupied" : ""}`}
                key={day}
              >
                <div className="calendar-day-number">
                  <span>{day.toLocaleString("fa-IR")}</span>
                  {isToday && <small>امروز</small>}
                </div>
                <div className="calendar-day-events">
                  {dayBookings.slice(0, 3).map((booking) => (
                    <Link
                      href={`/account/bookings/${booking.id}`}
                      key={booking.id}
                      title={`${booking.event_title} — ${booking.item_summary}`}
                    >
                      <i className={`status-${booking.reservation_status}`} />
                      <span>
                        <b>{booking.event_title}</b>
                        <small>
                          {formatJalaliDateTime(booking.start_at, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {booking.reference}
                        </small>
                      </span>
                    </Link>
                  ))}
                  {dayBookings.length > 3 && (
                    <span className="calendar-more">
                      +{(dayBookings.length - 3).toLocaleString("fa-IR")} رزرو دیگر
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="calendar-legend">
        <span><i className="status-held" /> در انتظار</span>
        <span><i className="status-confirmed" /> تأییدشده</span>
        <span><i className="status-fulfilled" /> تحویل‌شده</span>
      </div>
    </div>
  );
}
