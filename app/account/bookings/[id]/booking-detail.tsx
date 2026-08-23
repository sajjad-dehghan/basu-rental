"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusPill } from "@/app/components/status-pill";

type BookingRecord = {
  reference: string;
  event_title: string;
  reservation_status: string;
  payment_status: string;
  fulfilment_status: string;
  quote_required: number;
  subtotal_thousands: number | null;
  delivery_method: "pickup" | "delivery";
  delivery_address: string;
  start_at: string;
  end_at: string;
};
type LineRecord = {
  id: string;
  item_name_snapshot: string;
  quantity: number;
  total_thousands: number | null;
};
type EventRecord = {
  id: string;
  safe_note: string | null;
  event_type: string;
  created_at: string;
};
type Detail = {
  booking: BookingRecord;
  lines: LineRecord[];
  events: EventRecord[];
  deliveryQuote: {
    status: "pending" | "finalized";
    fee_thousands: number | null;
    note: string;
    reviewed_at: string | null;
  } | null;
  invoiceTotalThousands: number | null;
};
type DetailResponse =
  | { ok: true; data: Detail }
  | { ok: false; error?: { message?: string } };
type ActionResponse =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error?: { message?: string } };
type PaymentStartResponse =
  | { ok: true; data: { intentId: string } }
  | { ok: false; error?: { message?: string } };

export function BookingDetail({ bookingId }: { bookingId: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/app?resource=booking&id=${encodeURIComponent(bookingId)}`,
        { cache: "no-store" },
      );
      const result = (await response.json()) as DetailResponse;
      if (!result.ok)
        throw new Error(result.error?.message ?? "رزرو در دسترس نیست.");
      setData(result.data);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "خطا");
    }
  }, [bookingId]);

  useEffect(() => {
    // Initial remote-state synchronization; updates happen after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function action(payload: Record<string, unknown>, name: string) {
    setBusy(name);
    setError("");
    try {
      const response = await fetch("/api/app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ActionResponse;
      if (!result.ok)
        throw new Error(result.error?.message ?? "عملیات انجام نشد.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "خطا");
    } finally {
      setBusy("");
    }
  }

  async function payment() {
    const response = await fetch("/api/app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "payment.start",
        bookingId,
        idempotencyKey: crypto.randomUUID(),
      }),
    });
    const result = (await response.json()) as PaymentStartResponse;
    if (!result.ok)
      throw new Error(result.error?.message ?? "شروع پرداخت انجام نشد.");
    await action(
      { action: "payment.synthetic_settle", intentId: result.data.intentId },
      "payment",
    );
  }

  if (!data && !error)
    return (
      <section className="detail-loading">
        <div className="skeleton-card" />
      </section>
    );
  if (!data)
    return (
      <section className="empty-state">
        <h2>رزرو در دسترس نیست.</h2>
        <p>{error}</p>
        <Link href="/account">بازگشت</Link>
      </section>
    );
  const booking = data.booking;

  return (
    <section className="booking-detail-shell">
      <div className="booking-detail-head">
        <div>
          <Link href="/account">→ بازگشت به رزروها</Link>
          <small>{booking.reference}</small>
          <h1>{booking.event_title}</h1>
        </div>
        <div className="booking-statuses">
          <StatusPill value={booking.reservation_status} />
          <StatusPill value={booking.payment_status} />
          <StatusPill value={booking.fulfilment_status} />
        </div>
      </div>
      {error && <div className="form-message error">{error}</div>}
      <div className="detail-columns">
        <div className="detail-primary">
          <article className="panel">
            <h2>اقلام رزرو</h2>
            {data.lines.map((line) => (
              <div className="detail-line" key={line.id}>
                <span>
                  {line.item_name_snapshot}
                  <small>
                    تعداد {Number(line.quantity).toLocaleString("fa-IR")}
                  </small>
                </span>
                <b>
                  {line.total_thousands === null
                    ? "استعلام"
                    : `${Number(line.total_thousands).toLocaleString("fa-IR")} هزار تومان`}
                </b>
              </div>
            ))}
            <div className="detail-line invoice-line">
              <span>جمع تجهیزات</span>
              <b>
                {booking.subtotal_thousands === null
                  ? "نیازمند استعلام"
                  : `${Number(booking.subtotal_thousands).toLocaleString("fa-IR")} هزار تومان`}
              </b>
            </div>
            {booking.delivery_method === "delivery" && (
              <div className="detail-line invoice-line">
                <span>
                  هزینه ارسال
                  <small>
                    {data.deliveryQuote?.status === "finalized"
                      ? data.deliveryQuote.note
                      : "پس از بررسی نشانی و زمان‌بندی"}
                  </small>
                </span>
                <b>
                  {data.deliveryQuote?.status === "finalized" &&
                  data.deliveryQuote.fee_thousands !== null
                    ? `${Number(data.deliveryQuote.fee_thousands).toLocaleString("fa-IR")} هزار تومان`
                    : "در حال بررسی"}
                </b>
              </div>
            )}
            <div className="summary-total">
              <span>مبلغ فاکتور نهایی</span>
              <strong>
                {data.invoiceTotalThousands === null
                  ? "پس از بررسی اعلام می‌شود"
                  : `${Number(data.invoiceTotalThousands).toLocaleString("fa-IR")} هزار تومان`}
              </strong>
            </div>
          </article>
          <article className="panel">
            <h2>تاریخچه قابل ممیزی</h2>
            <div className="event-timeline">
              {data.events.map((event) => (
                <div key={event.id}>
                  <i />
                  <span>
                    <b>{event.safe_note || event.event_type}</b>
                    <small>
                      {new Date(event.created_at).toLocaleString("fa-IR", {
                        timeZone: "Asia/Tehran",
                      })}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          </article>
        </div>
        <aside className="detail-sidebar">
          <article className="panel">
            <h2>زمان رزرو</h2>
            <p>
              {new Date(booking.start_at).toLocaleString("fa-IR", {
                dateStyle: "full",
                timeStyle: "short",
                timeZone: "Asia/Tehran",
              })}
            </p>
            <small>
              تا{" "}
              {new Date(booking.end_at).toLocaleString("fa-IR", {
                dateStyle: "full",
                timeStyle: "short",
                timeZone: "Asia/Tehran",
              })}
            </small>
            <a
              className="secondary-action full"
              href={`/api/calendar/${bookingId}`}
            >
              افزودن به تقویم
            </a>
          </article>
          {booking.delivery_method === "delivery" && (
            <article className="panel">
              <h2>ارسال زمان‌بندی‌شده</h2>
              <p>{booking.delivery_address}</p>
              <small>
                {data.deliveryQuote?.status === "finalized"
                  ? "هزینه ارسال بررسی و در فاکتور نهایی اعمال شده است."
                  : "هزینه ارسال در حال بررسی است و پس از نهایی‌شدن به فاکتور اضافه می‌شود."}
              </small>
            </article>
          )}
          {booking.payment_status !== "paid" &&
            booking.quote_required === 1 && (
              <article className="panel pending-invoice-panel">
                <h2>فاکتور در حال تکمیل</h2>
                <p>
                  {booking.delivery_method === "delivery" &&
                  data.deliveryQuote?.status !== "finalized"
                    ? "هزینه ارسال پس از بررسی نشانی، زمان‌بندی و هزینه‌های اجرایی روی فاکتور نهایی اعمال می‌شود. پس از نهایی‌شدن، پرداخت فعال خواهد شد."
                    : "قیمت این رزرو هنوز نیازمند بررسی مدیر است."}
                </p>
              </article>
            )}
          {booking.payment_status !== "paid" &&
            booking.quote_required !== 1 && (
              <article className="panel action-panel">
                <h2>پرداخت</h2>
                <p>
                  در محیط محلی، adapter امن آزمایشی رفتار کامل پرداخت را
                  شبیه‌سازی می‌کند.
                </p>
                <button
                  disabled={Boolean(busy)}
                  className="primary-action"
                  onClick={() =>
                    payment().catch((caught: unknown) =>
                      setError(
                        caught instanceof Error ? caught.message : "خطا",
                      ),
                    )
                  }
                >
                  {busy === "payment"
                    ? "در حال پردازش…"
                    : "پرداخت آزمایشی و تأیید"}
                </button>
              </article>
            )}
          <article className="panel">
            <h2>تغییر زمان</h2>
            <label>
              <span>شروع جدید</span>
              <input
                type="datetime-local"
                value={newStart}
                onChange={(event) => setNewStart(event.target.value)}
              />
            </label>
            <label>
              <span>پایان جدید</span>
              <input
                type="datetime-local"
                value={newEnd}
                onChange={(event) => setNewEnd(event.target.value)}
              />
            </label>
            <button
              className="secondary-action full"
              disabled={!newStart || !newEnd || Boolean(busy)}
              onClick={() =>
                action(
                  {
                    action: "booking.reschedule",
                    bookingId,
                    startAt: newStart,
                    endAt: newEnd,
                  },
                  "reschedule",
                )
              }
            >
              بررسی و تغییر
            </button>
          </article>
          <article className="panel danger-panel">
            <h2>لغو رزرو</h2>
            <p>
              تا ۲۴ ساعت پیش از شروع، لغو آنلاین طبق نسخه سیاست فعال امکان‌پذیر
              است.
            </p>
            <button
              disabled={Boolean(busy)}
              onClick={() =>
                action({ action: "booking.cancel", bookingId }, "cancel")
              }
            >
              {busy === "cancel" ? "در حال لغو…" : "لغو رزرو"}
            </button>
          </article>
        </aside>
      </div>
    </section>
  );
}
