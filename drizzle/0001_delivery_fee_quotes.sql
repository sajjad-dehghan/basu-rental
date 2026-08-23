CREATE TABLE IF NOT EXISTS delivery_quotes (
  booking_id TEXT PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','finalized')),
  fee_thousands INTEGER CHECK(fee_thousands IS NULL OR fee_thousands >= 0),
  reviewed_by_user_id TEXT REFERENCES users(id),
  reviewed_at TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK((status = 'pending' AND fee_thousands IS NULL) OR (status = 'finalized' AND fee_thousands IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_delivery_quotes_status ON delivery_quotes(status, updated_at);
--> statement-breakpoint
INSERT OR IGNORE INTO delivery_quotes
  (booking_id, status, fee_thousands, reviewed_by_user_id, reviewed_at, note, created_at, updated_at)
SELECT id, 'pending', NULL, NULL, NULL, 'نیازمند بررسی هزینه ارسال', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM bookings WHERE delivery_method = 'delivery';
--> statement-breakpoint
UPDATE bookings SET quote_required = 1, updated_at = CURRENT_TIMESTAMP
WHERE delivery_method = 'delivery' AND payment_status <> 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM delivery_quotes dq
    WHERE dq.booking_id = bookings.id AND dq.status = 'finalized'
  );
--> statement-breakpoint
INSERT OR IGNORE INTO policy_versions
  (id, policy_type, version, config_json, effective_at, active)
VALUES (
  'policy-delivery-v1',
  'delivery',
  '1',
  '{"feeMode":"admin-reviewed","paymentBlockedUntilFinalized":true,"currency":"TOMAN"}',
  CURRENT_TIMESTAMP,
  1
);
