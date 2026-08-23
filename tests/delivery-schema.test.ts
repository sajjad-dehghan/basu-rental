import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { SCHEMA_STATEMENTS } from "../app/lib/schema";

describe("پایداری دیتابیس هزینه ارسال", () => {
  it("فاکتور ارسال را تا ثبت مبلغ در وضعیت pending نگه می‌دارد", () => {
    const db = new DatabaseSync(":memory:");
    for (const statement of SCHEMA_STATEMENTS) db.exec(statement);
    db.exec(`
      INSERT INTO users (id, email, display_name, role, basu_status, created_at, updated_at)
      VALUES ('user-test', 'test@example.com', 'کاربر تست', 'customer', 'unverified', '2026-01-01', '2026-01-01');
      INSERT INTO bookings (
        id, reference, user_id, audience, reservation_status, payment_status, fulfilment_status,
        start_at, end_at, contact_phone, event_title, delivery_method, delivery_address,
        subtotal_thousands, quote_required, policy_version, created_at, updated_at
      ) VALUES (
        'booking-test', 'BR-TEST', 'user-test', 'public', 'held', 'not_started', 'unscheduled',
        '2026-09-01T10:00:00Z', '2026-09-01T12:00:00Z', '09120000000', 'رویداد تست',
        'delivery', 'همدان، نشانی تست', 1316, 1, 'delivery:1', '2026-01-01', '2026-01-01'
      );
      INSERT INTO delivery_quotes (booking_id, status, fee_thousands, note, created_at, updated_at)
      VALUES ('booking-test', 'pending', NULL, 'در حال بررسی', '2026-01-01', '2026-01-01');
    `);

    const pending = db
      .prepare(
        "SELECT status, fee_thousands FROM delivery_quotes WHERE booking_id = ?",
      )
      .get("booking-test") as {
      status: string;
      fee_thousands: number | null;
    };
    assert.equal(pending.status, "pending");
    assert.equal(pending.fee_thousands, null);
    assert.throws(() =>
      db.exec(
        "UPDATE delivery_quotes SET status='finalized' WHERE booking_id='booking-test'",
      ),
    );

    db.exec(`
      UPDATE delivery_quotes
      SET status='finalized', fee_thousands=180, reviewed_at='2026-01-02', updated_at='2026-01-02'
      WHERE booking_id='booking-test';
      UPDATE bookings SET quote_required=0 WHERE id='booking-test';
    `);
    const invoice = db
      .prepare(
        `
      SELECT b.quote_required, b.subtotal_thousands + dq.fee_thousands AS final_total
      FROM bookings b JOIN delivery_quotes dq ON dq.booking_id=b.id WHERE b.id=?
    `,
      )
      .get("booking-test") as { quote_required: number; final_total: number };
    assert.equal(invoice.quote_required, 0);
    assert.equal(invoice.final_total, 1496);
    db.close();
  });
});
