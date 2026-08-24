"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusPill } from "../components/status-pill";
import { formatJalaliDateTime } from "../lib/jalali";

type Booking = {
  id: string;
  reference: string;
  reservation_status: string;
  payment_status: string;
  fulfilment_status: string;
  start_at: string;
  end_at: string;
  event_title: string;
  item_summary: string;
  subtotal_thousands: number | null;
  quote_required: number;
  delivery_method: "pickup" | "delivery";
  delivery_quote_status: "pending" | "finalized" | null;
  created_at: string;
};

type BookingsResponse =
  | { ok: true; data: Booking[] }
  | { ok: false; error?: { message?: string } };

export function AccountDashboard() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/app?resource=bookings", {
        cache: "no-store",
      });
      const result = (await response.json()) as BookingsResponse;
      if (!result.ok)
        throw new Error(result.error?.message ?? "دریافت رزروها انجام نشد.");
      setItems(result.data);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "خطا");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial remote-state synchronization; updates happen after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (loading)
    return (
      <section className="account-shell">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </section>
    );
  if (error)
    return (
      <section className="empty-state">
        <b>دریافت رزروها انجام نشد.</b>
        <p>{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            void load();
          }}
        >
          تلاش دوباره
        </button>
      </section>
    );
  if (!items.length)
    return (
      <section className="empty-state">
        <span>◎</span>
        <h2>هنوز رزروی نداری.</h2>
        <p>تجهیزاتت را انتخاب کن و اولین بسته رویدادت را بساز.</p>
        <Link className="primary-action" href="/book">
          شروع رزرو <i>←</i>
        </Link>
      </section>
    );

  return (
    <section className="account-shell">
      <div className="account-toolbar">
        <div>
          <b>{items.length.toLocaleString("fa-IR")} رزرو</b>
          <span>مرتب‌شده بر اساس جدیدترین</span>
        </div>
        <Link className="primary-action small" href="/book">
          رزرو جدید +
        </Link>
      </div>
      <div className="booking-list">
        {items.map((item) => (
          <article className="booking-row" key={item.id}>
            <div className="booking-reference">
              <small>{item.reference}</small>
              <h2>{item.event_title}</h2>
              <p>{item.item_summary}</p>
            </div>
            <div className="booking-date">
              <span>بازه رزرو</span>
              <b>
                {formatJalaliDateTime(item.start_at, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </b>
              <small>
                تا{" "}
                {formatJalaliDateTime(item.end_at, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </small>
            </div>
            <div className="booking-statuses">
              <StatusPill value={item.reservation_status} />
              <StatusPill value={item.payment_status} />
              <StatusPill value={item.fulfilment_status} />
              {item.delivery_method === "delivery" && (
                <StatusPill
                  value={
                    item.delivery_quote_status === "finalized"
                      ? "delivery_fee_finalized"
                      : "delivery_fee_pending"
                  }
                />
              )}
            </div>
            <Link className="row-action" href={`/account/bookings/${item.id}`}>
              جزئیات و عملیات ←
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
