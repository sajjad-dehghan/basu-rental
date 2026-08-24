"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { JalaliDateTimePicker } from "../components/jalali-date-time-picker";
import {
  CATALOG,
  formatTomanFromThousands,
  quoteLine,
  tierPricingInsight,
  type Audience,
} from "../lib/catalog";
type ApiResult = {
  ok: boolean;
  data?: {
    bookingId: string;
    reference: string;
    subtotalThousands: number | null;
    quoteRequired: boolean;
  };
  error?: { message: string; code: string };
};
export function BookingBuilder() {
  const initial =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("item") ?? "eq-gown")
      : "eq-gown";
  const [quantities, setQuantities] = useState<Record<string, number>>({
    [initial]: 1,
  });
  const [audience, setAudience] = useState<Audience>("public");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("جشن فارغ‌التحصیلی");
  const [delivery, setDelivery] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    kind: "error" | "success";
    text: string;
    id?: string;
  } | null>(null);
  const lines = useMemo(
    () =>
      CATALOG.filter((item) => (quantities[item.id] ?? 0) > 0).map((item) => {
        const quantity = quantities[item.id];
        return {
          item,
          quantity,
          quote: quoteLine(item, quantity, audience),
          pricingInsight: tierPricingInsight(item, quantity, audience),
        };
      }),
    [quantities, audience],
  );
  const total = lines.every((line) => line.quote.totalThousands !== null)
    ? lines.reduce((sum, line) => sum + (line.quote.totalThousands ?? 0), 0)
    : null;
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const totalSaving = lines.reduce(
    (sum, line) => sum + (line.pricingInsight?.totalSavingThousands ?? 0),
    0,
  );
  function update(itemId: string, value: number, capacity: number) {
    setQuantities((current) => ({
      ...current,
      [itemId]: Math.max(
        0,
        Math.min(capacity, Number.isFinite(value) ? value : 0),
      ),
    }));
  }
  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "booking.create",
          payload: {
            audience,
            startAt,
            endAt,
            contactPhone: phone,
            eventTitle: title,
            deliveryMethod: delivery,
            deliveryAddress: address,
            lines: lines.map((line) => ({
              equipmentId: line.item.id,
              quantity: line.quantity,
            })),
            idempotencyKey: crypto.randomUUID(),
          },
        }),
      });
      const result = (await response.json()) as ApiResult;
      if (!result.ok || !result.data)
        throw new Error(result.error?.message ?? "ثبت رزرو انجام نشد.");
      setMessage({
        kind: "success",
        text:
          delivery === "delivery"
            ? `رزرو ${result.data.reference} ثبت شد. هزینه ارسال پس از بررسی در فاکتور نهایی اعمال می‌شود.`
            : `رزرو ${result.data.reference} با موفقیت ایجاد شد.`,
        id: result.data.bookingId,
      });
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "خطای غیرمنتظره",
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="builder-shell">
      <div className="builder-main">
        <div className="builder-block">
          <div className="builder-heading">
            <span>۱</span>
            <div>
              <h2>تجهیزات</h2>
              <p>برای حذف هر قلم، تعداد را صفر کن.</p>
            </div>
          </div>
          <div className="builder-items">
            {CATALOG.map((item) => {
              const quantity = quantities[item.id] ?? 0;
              const quote =
                quantity > 0 ? quoteLine(item, quantity, audience) : null;
              const insight =
                quantity > 0
                  ? tierPricingInsight(item, quantity, audience)
                  : null;
              return (
                <div
                  className={
                    quantity > 0
                      ? `builder-item selected${item.tiers ? " tiered" : ""}`
                      : "builder-item"
                  }
                  key={item.id}
                >
                  <div className={`mini-art accent-${item.accent}`}>
                    {item.art}
                  </div>
                  <div className="builder-item-copy">
                    <b>{item.name}</b>
                    <small>
                      {formatTomanFromThousands(
                        quote
                          ? quote.unitThousands
                          : audience === "basu"
                            ? item.basuThousands
                            : item.publicThousands,
                      )}
                      {quantity > 0 && item.tiers ? " برای هر لباس" : ""}
                    </small>
                  </div>
                  <label>
                    <span>تعداد</span>
                    <input
                      aria-label={`تعداد ${item.name}`}
                      type="number"
                      min="0"
                      max={item.capacity}
                      value={quantity}
                      onChange={(event) =>
                        update(
                          item.id,
                          Number(event.target.value),
                          item.capacity,
                        )
                      }
                    />
                  </label>
                  {insight && (
                    <div className="tier-feedback" aria-live="polite">
                      <div className="tier-current">
                        <span>قیمت واحد برای {quantity.toLocaleString("fa-IR")} لباس</span>
                        <strong>{formatTomanFromThousands(insight.currentUnitThousands)}</strong>
                      </div>
                      {insight.savingPerUnitThousands !== null &&
                        insight.savingPerUnitThousands > 0 && (
                          <div className="tier-saving">
                            <b>
                              هر لباس {formatTomanFromThousands(insight.savingPerUnitThousands)} ارزان‌تر
                            </b>
                            <small>
                              در مجموع {formatTomanFromThousands(insight.totalSavingThousands)} صرفه‌جویی نسبت به قیمت تک‌لباس
                            </small>
                          </div>
                        )}
                      {insight.nextQuantity !== null && (
                        <p>
                          پله بعدی: با {insight.nextQuantity.toLocaleString("fa-IR")} لباس، قیمت هر لباس
                          {" "}{formatTomanFromThousands(insight.nextUnitThousands)} می‌شود.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="builder-block">
          <div className="builder-heading">
            <span>۲</span>
            <div>
              <h2>زمان و نوع قیمت</h2>
              <p>بازه‌ها به وقت تهران نمایش داده می‌شوند.</p>
            </div>
          </div>
          <div className="form-grid wide">
            <JalaliDateTimePicker
              label="شروع"
              value={startAt}
              onChange={setStartAt}
            />
            <JalaliDateTimePicker
              label="پایان"
              value={endAt}
              minValue={startAt || undefined}
              onChange={setEndAt}
            />
          </div>
          <div className="audience-switch">
            <button
              className={audience === "public" ? "active" : ""}
              onClick={() => setAudience("public")}
              type="button"
            >
              <b>قیمت آزاد</b>
              <small>برای همه کاربران</small>
            </button>
            <button
              className={audience === "basu" ? "active" : ""}
              onClick={() => setAudience("basu")}
              type="button"
            >
              <b>قیمت بوعلی</b>
              <small>نیازمند احراز عضویت</small>
            </button>
          </div>
        </div>
        <div className="builder-block">
          <div className="builder-heading">
            <span>۳</span>
            <div>
              <h2>جزئیات تحویل</h2>
              <p>فقط حداقل اطلاعات لازم نگهداری می‌شود.</p>
            </div>
          </div>
          <div className="form-grid wide">
            <label>
              <span>عنوان رویداد</span>
              <input
                value={title}
                maxLength={90}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label>
              <span>شماره تماس</span>
              <input
                inputMode="tel"
                placeholder="0912…"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
          </div>
          <div className="audience-switch">
            <button
              className={delivery === "pickup" ? "active" : ""}
              onClick={() => setDelivery("pickup")}
              type="button"
            >
              <b>دریافت حضوری</b>
              <small>هماهنگی slot بعد از پرداخت</small>
            </button>
            <button
              className={delivery === "delivery" ? "active" : ""}
              onClick={() => setDelivery("delivery")}
              type="button"
            >
              <b>ارسال</b>
              <small>با زمان‌بندی و مسئول تحویل</small>
            </button>
          </div>
          {delivery === "delivery" && (
            <>
              <label className="full-field">
                <span>نشانی تحویل</span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={300}
                />
              </label>
              <div className="form-message info">
                مبلغ ارسال پس از بررسی نشانی، زمان‌بندی و هزینه‌های اجرایی به
                فاکتور نهایی اضافه می‌شود. پرداخت تا نهایی‌شدن این مبلغ فعال
                نخواهد شد.
              </div>
            </>
          )}
        </div>
      </div>
      <aside className="builder-summary">
        <div className="receipt-head">
          <div>
            <span className="summary-kicker">رسید زنده رزرو</span>
            <h2>{totalQuantity.toLocaleString("fa-IR")} عدد از {lines.length.toLocaleString("fa-IR")} نوع تجهیز</h2>
          </div>
          <span className="receipt-audience">
            {audience === "basu" ? "نرخ بوعلی" : "نرخ آزاد"}
          </span>
        </div>
        <div className="summary-lines">
          {lines.map((line) => (
            <div className="receipt-line" key={line.item.id}>
              <div className="receipt-line-title">
                <span>{line.item.name}</span>
                <small>
                  {line.quantity.toLocaleString("fa-IR")} × {formatTomanFromThousands(line.quote.unitThousands)}
                </small>
                {line.pricingInsight?.savingPerUnitThousands !== null &&
                  (line.pricingInsight?.savingPerUnitThousands ?? 0) > 0 && (
                    <em>
                      تخفیف تعدادی: {formatTomanFromThousands(line.pricingInsight?.totalSavingThousands ?? 0)}
                    </em>
                  )}
              </div>
              <b>{formatTomanFromThousands(line.quote.totalThousands)}</b>
            </div>
          ))}
          {delivery === "delivery" && (
            <div className="delivery-fee-pending">
              <span>
                هزینه ارسال
                <small>پس از بررسی زمان‌بندی و نشانی</small>
              </span>
              <b>در حال بررسی</b>
            </div>
          )}
        </div>
        {totalSaving > 0 && (
          <div className="receipt-saving-total">
            <span>صرفه‌جویی با قیمت پلکانی</span>
            <b>{formatTomanFromThousands(totalSaving)}</b>
          </div>
        )}
        <div className="summary-total">
          <span>{delivery === "delivery" ? "جمع تجهیزات" : "جمع برآورد"}</span>
          <strong>{formatTomanFromThousands(total)}</strong>
          <small>
            {delivery === "delivery"
              ? "جمع نهایی پس از افزودن هزینه ارسال صادر می‌شود."
              : audience === "basu"
                ? "قیمت بوعلی پس از احراز نهایی می‌شود."
                : "قیمت آزاد"}
          </small>
        </div>
        {message && (
          <div className={`form-message ${message.kind}`}>
            {message.text}
            {message.id && (
              <Link href={`/account/bookings/${message.id}`}>
                مشاهده رزرو ←
              </Link>
            )}
          </div>
        )}
        <button
          className="primary-action summary-submit"
          disabled={busy || lines.length === 0 || !startAt || !endAt || !phone}
          onClick={submit}
        >
          {busy ? "در حال ثبت…" : "بررسی نهایی و ثبت رزرو"} <span>←</span>
        </button>
        <p className="summary-note">
          موجودی در لحظه ثبت دوباره و به‌صورت اتمیک کنترل می‌شود.
        </p>
      </aside>
    </section>
  );
}
