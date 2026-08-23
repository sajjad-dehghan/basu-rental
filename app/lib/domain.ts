import { CATALOG, SOURCE_WORKBOOK, findCatalogItem, quoteLine, type Audience } from './catalog';
import { ensureDatabase, queryAll, queryFirst } from './db';
import { AppError, makeReference, parseIso, positiveInt, safeText, type Actor } from './security';

const ACTIVE_RESERVATIONS = "('held','confirmed','fulfilled')";

type BookingRow = {
  id: string; reference: string; user_id: string; audience: Audience;
  reservation_status: string; payment_status: string; fulfilment_status: string;
  start_at: string; end_at: string; contact_phone: string; event_title: string;
  delivery_method: string; delivery_address: string; subtotal_thousands: number | null;
  quote_required: number; created_at: string; updated_at: string;
};

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function assertInterval(startAt: string, endAt: string) {
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);
  if (!(start < end)) throw new AppError('invalid_interval', 'زمان پایان باید بعد از زمان شروع باشد.');
  if (end - start > 1000 * 60 * 60 * 24 * 31) throw new AppError('interval_too_long', 'حداکثر بازه رزرو ۳۱ روز است.');
}

export async function catalogWithAvailability(startAt?: string, endAt?: string) {
  await ensureDatabase();
  let interval: [string, string] | null = null;
  if (startAt && endAt) {
    interval = [parseIso(startAt, 'زمان شروع'), parseIso(endAt, 'زمان پایان')];
    assertInterval(...interval);
  }
  const rows = await queryAll<{ id: string; capacity: number; used: number }>(interval ? `
    SELECT e.id, e.capacity, COALESCE(SUM(CASE WHEN b.id IS NOT NULL THEN bl.quantity ELSE 0 END), 0) AS used
    FROM equipment e
    LEFT JOIN booking_lines bl ON bl.equipment_id = e.id
    LEFT JOIN bookings b ON b.id = bl.booking_id
      AND b.reservation_status IN ${ACTIVE_RESERVATIONS}
      AND b.start_at < ? AND b.end_at > ?
    WHERE e.published = 1
    GROUP BY e.id, e.capacity` : `
    SELECT e.id, e.capacity, 0 AS used FROM equipment e WHERE e.published = 1`,
    ...(interval ? [interval[1], interval[0]] : []));
  const use = new Map(rows.map((row) => [row.id, Number(row.used)]));
  return CATALOG.map((item) => ({ ...item, available: Math.max(0, item.capacity - (use.get(item.id) ?? 0)) }));
}

export async function createBooking(actor: Actor, raw: unknown) {
  if (!raw || typeof raw !== 'object') throw new AppError('invalid_payload', 'اطلاعات رزرو کامل نیست.');
  const body = raw as Record<string, unknown>;
  const startAt = parseIso(body.startAt, 'زمان شروع');
  const endAt = parseIso(body.endAt, 'زمان پایان');
  assertInterval(startAt, endAt);
  const audience: Audience = body.audience === 'basu' ? 'basu' : 'public';
  if (audience === 'basu' && actor.basuStatus !== 'verified' && actor.role !== 'admin') {
    throw new AppError('membership_required', 'قیمت بوعلی پس از تأیید عضویت فعال می‌شود.', 403);
  }
  const contactPhone = safeText(body.contactPhone, 24);
  if (!/^\+?[۰-۹0-9\-\s]{7,20}$/.test(contactPhone)) throw new AppError('invalid_phone', 'شماره تماس معتبر وارد کنید.');
  const eventTitle = safeText(body.eventTitle, 90) || 'رویداد من';
  const deliveryMethod = body.deliveryMethod === 'delivery' ? 'delivery' : 'pickup';
  const deliveryAddress = deliveryMethod === 'delivery' ? safeText(body.deliveryAddress, 300) : '';
  if (deliveryMethod === 'delivery' && deliveryAddress.length < 8) throw new AppError('address_required', 'نشانی تحویل را کامل وارد کنید.');
  const idempotencyKey = safeText(body.idempotencyKey, 100);
  if (idempotencyKey.length < 12) throw new AppError('idempotency_required', 'شناسه امن درخواست وجود ندارد.');
  const inputLines = Array.isArray(body.lines) ? body.lines : [];
  if (inputLines.length < 1 || inputLines.length > CATALOG.length) throw new AppError('invalid_lines', 'حداقل یک تجهیز انتخاب کنید.');
  const unique = new Set<string>();
  const lines = inputLines.map((candidate) => {
    if (!candidate || typeof candidate !== 'object') throw new AppError('invalid_line', 'یکی از اقلام معتبر نیست.');
    const line = candidate as Record<string, unknown>;
    const equipmentId = safeText(line.equipmentId, 50);
    const item = findCatalogItem(equipmentId);
    if (!item || unique.has(item.id)) throw new AppError('invalid_equipment', 'تجهیز انتخاب‌شده معتبر نیست.');
    unique.add(item.id);
    return { item, quantity: positiveInt(line.quantity, 30), quote: quoteLine(item, positiveInt(line.quantity, 30), audience) };
  });
  const db = await ensureDatabase();
  const prior = await db.prepare('SELECT result_json FROM idempotency_keys WHERE key = ? AND actor_user_id = ? AND action = ?')
    .bind(idempotencyKey, actor.id, 'booking.create').first<{ result_json: string }>();
  if (prior) return JSON.parse(prior.result_json) as unknown;

  const now = new Date().toISOString();
  const bookingId = id('booking');
  const reference = makeReference();
  const subtotal = lines.every((line) => line.quote.totalThousands !== null)
    ? lines.reduce((sum, line) => sum + (line.quote.totalThousands ?? 0), 0)
    : null;
  const quoteRequired = subtotal === null ? 1 : 0;
  await db.prepare(`INSERT INTO bookings
    (id, reference, user_id, audience, reservation_status, payment_status, fulfilment_status, start_at, end_at,
     contact_phone, event_title, delivery_method, delivery_address, subtotal_thousands, quote_required, policy_version, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'held', 'not_started', 'unscheduled', ?, ?, ?, ?, ?, ?, ?, ?, 'rental:1|pricing:1', ?, ?)`)
    .bind(bookingId, reference, actor.id, audience, startAt, endAt, contactPhone, eventTitle,
      deliveryMethod, deliveryAddress, subtotal, quoteRequired, now, now).run();

  try {
    for (const line of lines) {
      const result = await db.prepare(`INSERT INTO booking_lines
        (id, booking_id, equipment_id, item_name_snapshot, quantity, unit_price_thousands, total_thousands, source_ref)
        SELECT ?, ?, e.id, e.name, ?, ?, ?, ? FROM equipment e
        WHERE e.id = ? AND e.published = 1 AND e.capacity - (
          SELECT COALESCE(SUM(bl.quantity), 0)
          FROM booking_lines bl JOIN bookings b ON b.id = bl.booking_id
          WHERE bl.equipment_id = e.id AND b.id <> ?
            AND b.reservation_status IN ${ACTIVE_RESERVATIONS}
            AND b.start_at < ? AND b.end_at > ?
        ) >= ?`)
        .bind(id('line'), bookingId, line.quantity, line.quote.unitThousands, line.quote.totalThousands,
          SOURCE_WORKBOOK, line.item.id, bookingId, endAt, startAt, line.quantity).run();
      if ((result.meta.changes ?? 0) !== 1) throw new AppError('capacity_conflict', `موجودی «${line.item.name}» برای این بازه کافی نیست.`, 409);
    }
    const eventId = id('event');
    const reminderAt = new Date(Math.max(Date.now(), Date.parse(startAt) - 24 * 60 * 60 * 1000)).toISOString();
    await db.batch([
      db.prepare(`INSERT INTO booking_events (id, booking_id, event_type, from_value, to_value, actor_user_id, safe_note, created_at)
        VALUES (?, ?, 'reservation_status', NULL, 'held', ?, 'رزرو ایجاد شد', ?)`).bind(eventId, bookingId, actor.id, now),
      db.prepare(`INSERT INTO notification_jobs
        (id, booking_id, channel, template, due_at, status, attempts, dedupe_key, last_error_code, updated_at)
        VALUES (?, ?, 'in_app', 'booking_reminder', ?, 'pending', 0, ?, '', ?)`)
        .bind(id('notification'), bookingId, reminderAt, `booking:${bookingId}:reminder:v1`, now),
      db.prepare(`INSERT INTO audit_events
        (id, actor_user_id, entity_type, entity_id, action, result_code, correlation_id, created_at)
        VALUES (?, ?, 'booking', ?, 'create', 'held', ?, ?)`)
        .bind(id('audit'), actor.id, bookingId, eventId, now),
    ]);
    const result = { bookingId, reference, reservationStatus: 'held', paymentStatus: 'not_started', subtotalThousands: subtotal, quoteRequired: Boolean(quoteRequired) };
    await db.prepare(`INSERT INTO idempotency_keys (key, actor_user_id, action, result_json, created_at) VALUES (?, ?, 'booking.create', ?, ?)`)
      .bind(idempotencyKey, actor.id, JSON.stringify(result), now).run();
    return result;
  } catch (error) {
    await db.batch([
      db.prepare('DELETE FROM booking_lines WHERE booking_id = ?').bind(bookingId),
      db.prepare('DELETE FROM bookings WHERE id = ?').bind(bookingId),
    ]);
    throw error;
  }
}

export async function listBookings(actor: Actor, admin = false) {
  if (admin && actor.role !== 'admin') throw new AppError('admin_required', 'دسترسی مدیر لازم است.', 403);
  const where = admin ? '' : 'WHERE b.user_id = ?';
  const values = admin ? [] : [actor.id];
  return queryAll<BookingRow & { customer_name: string; line_count: number; item_summary: string }>(`
    SELECT b.*, u.display_name AS customer_name, COUNT(bl.id) AS line_count,
      GROUP_CONCAT(bl.item_name_snapshot || ' × ' || bl.quantity, '، ') AS item_summary
    FROM bookings b JOIN users u ON u.id = b.user_id
    LEFT JOIN booking_lines bl ON bl.booking_id = b.id
    ${where}
    GROUP BY b.id
    ORDER BY b.created_at DESC LIMIT 100`, ...values);
}

export async function getBooking(actor: Actor, bookingId: string) {
  const booking = await queryFirst<BookingRow & { customer_name: string }>(`
    SELECT b.*, u.display_name AS customer_name FROM bookings b JOIN users u ON u.id = b.user_id WHERE b.id = ?`, bookingId);
  if (!booking || (actor.role !== 'admin' && booking.user_id !== actor.id)) throw new AppError('not_found', 'رزرو پیدا نشد.', 404);
  const [lines, events, fulfilment, notifications, payments] = await Promise.all([
    queryAll('SELECT * FROM booking_lines WHERE booking_id = ? ORDER BY item_name_snapshot', bookingId),
    queryAll('SELECT * FROM booking_events WHERE booking_id = ? ORDER BY created_at DESC', bookingId),
    queryFirst('SELECT * FROM fulfilments WHERE booking_id = ?', bookingId),
    queryAll('SELECT id, channel, template, due_at, status, attempts FROM notification_jobs WHERE booking_id = ? ORDER BY due_at', bookingId),
    queryAll('SELECT id, provider, amount_thousands, status, created_at, updated_at FROM payment_intents WHERE booking_id = ? ORDER BY created_at DESC', bookingId),
  ]);
  return { booking, lines, events, fulfilment, notifications, payments };
}

export async function cancelBooking(actor: Actor, bookingId: string) {
  const booking = await getBooking(actor, bookingId);
  if (['cancelled', 'returned', 'closed'].includes(booking.booking.reservation_status)) throw new AppError('invalid_transition', 'این رزرو قابل لغو نیست.', 409);
  const hours = (Date.parse(booking.booking.start_at) - Date.now()) / 3_600_000;
  if (actor.role !== 'admin' && hours < 24) throw new AppError('policy_denied', 'لغو آنلاین تا ۲۴ ساعت پیش از شروع ممکن است.', 409);
  const db = await ensureDatabase();
  const now = new Date().toISOString();
  const correlation = id('event');
  await db.batch([
    db.prepare(`UPDATE bookings SET reservation_status = 'cancelled', fulfilment_status = 'cancelled', updated_at = ? WHERE id = ?`)
      .bind(now, bookingId),
    db.prepare(`UPDATE notification_jobs SET status = 'cancelled', updated_at = ? WHERE booking_id = ? AND status IN ('pending','retry')`)
      .bind(now, bookingId),
    db.prepare(`INSERT INTO booking_events (id, booking_id, event_type, from_value, to_value, actor_user_id, safe_note, created_at)
      VALUES (?, ?, 'reservation_status', ?, 'cancelled', ?, 'لغو طبق سیاست نسخه ۱', ?)`)
      .bind(correlation, bookingId, booking.booking.reservation_status, actor.id, now),
    db.prepare(`INSERT INTO audit_events (id, actor_user_id, entity_type, entity_id, action, result_code, correlation_id, created_at)
      VALUES (?, ?, 'booking', ?, 'cancel', 'cancelled', ?, ?)`)
      .bind(id('audit'), actor.id, bookingId, correlation, now),
  ]);
  return { bookingId, reservationStatus: 'cancelled' };
}

export async function rescheduleBooking(actor: Actor, bookingId: string, rawStart: unknown, rawEnd: unknown) {
  const detail = await getBooking(actor, bookingId);
  if (!['held', 'confirmed'].includes(detail.booking.reservation_status)) throw new AppError('invalid_transition', 'این رزرو قابل تغییر زمان نیست.', 409);
  const startAt = parseIso(rawStart, 'زمان شروع');
  const endAt = parseIso(rawEnd, 'زمان پایان');
  assertInterval(startAt, endAt);
  const lines = detail.lines as Array<{ equipment_id: string; quantity: number }>;
  for (const line of lines) {
    const row = await queryFirst<{ capacity: number; used: number }>(`
      SELECT e.capacity, COALESCE(SUM(bl.quantity), 0) AS used
      FROM equipment e LEFT JOIN booking_lines bl ON bl.equipment_id = e.id
      LEFT JOIN bookings b ON b.id = bl.booking_id AND b.id <> ? AND b.reservation_status IN ${ACTIVE_RESERVATIONS}
        AND b.start_at < ? AND b.end_at > ?
      WHERE e.id = ? GROUP BY e.id`, bookingId, endAt, startAt, line.equipment_id);
    if (!row || row.capacity - Number(row.used) < line.quantity) throw new AppError('capacity_conflict', 'موجودی برای زمان جدید کافی نیست.', 409);
  }
  const db = await ensureDatabase();
  const now = new Date().toISOString();
  await db.batch([
    db.prepare('UPDATE bookings SET start_at = ?, end_at = ?, updated_at = ? WHERE id = ?').bind(startAt, endAt, now, bookingId),
    db.prepare(`INSERT INTO booking_events (id, booking_id, event_type, from_value, to_value, actor_user_id, safe_note, created_at)
      VALUES (?, ?, 'schedule', ?, ?, ?, 'زمان رزرو تغییر کرد', ?)`)
      .bind(id('event'), bookingId, `${detail.booking.start_at}/${detail.booking.end_at}`, `${startAt}/${endAt}`, actor.id, now),
  ]);
  return { bookingId, startAt, endAt };
}

export async function joinWaitlist(actor: Actor, raw: Record<string, unknown>) {
  const equipmentId = safeText(raw.equipmentId, 50);
  if (!findCatalogItem(equipmentId)) throw new AppError('invalid_equipment', 'تجهیز معتبر نیست.');
  const startAt = parseIso(raw.startAt, 'زمان شروع');
  const endAt = parseIso(raw.endAt, 'زمان پایان');
  assertInterval(startAt, endAt);
  const quantity = positiveInt(raw.quantity, 30);
  const db = await ensureDatabase();
  const waitlistId = id('waitlist');
  await db.prepare(`INSERT INTO waitlist_entries (id, user_id, equipment_id, start_at, end_at, quantity, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?)`)
    .bind(waitlistId, actor.id, equipmentId, startAt, endAt, quantity, new Date().toISOString()).run();
  return { waitlistId, status: 'waiting' };
}

export async function startPayment(actor: Actor, bookingId: string, idempotencyKey: string) {
  const detail = await getBooking(actor, bookingId);
  if (detail.booking.quote_required || detail.booking.subtotal_thousands === null) throw new AppError('quote_required', 'ابتدا قیمت این رزرو باید توسط مدیر نهایی شود.', 409);
  if (!['held', 'confirmed'].includes(detail.booking.reservation_status)) throw new AppError('invalid_transition', 'پرداخت برای این رزرو فعال نیست.', 409);
  const db = await ensureDatabase();
  const prior = await db.prepare('SELECT id, status, amount_thousands FROM payment_intents WHERE idempotency_key = ?')
    .bind(idempotencyKey).first();
  if (prior) return prior;
  const intentId = id('payment');
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(`INSERT INTO payment_intents
      (id, booking_id, provider, amount_thousands, currency, status, idempotency_key, created_at, updated_at)
      VALUES (?, ?, 'synthetic', ?, 'TOMAN', 'pending', ?, ?, ?)`)
      .bind(intentId, bookingId, detail.booking.subtotal_thousands, idempotencyKey, now, now),
    db.prepare(`UPDATE bookings SET payment_status = 'pending', updated_at = ? WHERE id = ?`).bind(now, bookingId),
  ]);
  return { intentId, status: 'pending', amountThousands: detail.booking.subtotal_thousands, provider: 'synthetic' };
}

export async function settleSyntheticPayment(actor: Actor, intentId: string) {
  if (process.env.NODE_ENV === 'production') throw new AppError('provider_not_configured', 'درگاه تولیدی هنوز فعال نشده است.', 503);
  const db = await ensureDatabase();
  const intent = await db.prepare(`SELECT pi.*, b.user_id FROM payment_intents pi JOIN bookings b ON b.id = pi.booking_id WHERE pi.id = ?`)
    .bind(intentId).first<{ id: string; booking_id: string; user_id: string; amount_thousands: number; status: string }>();
  if (!intent || (actor.role !== 'admin' && intent.user_id !== actor.id)) throw new AppError('not_found', 'پرداخت پیدا نشد.', 404);
  if (intent.status === 'paid') return { intentId, status: 'paid', replay: true };
  const now = new Date().toISOString();
  const providerEventId = `synthetic:${intentId}:success`;
  await db.batch([
    db.prepare(`INSERT OR IGNORE INTO payment_events
      (id, intent_id, provider_event_id, event_type, amount_thousands, signature_verified, created_at)
      VALUES (?, ?, ?, 'payment.succeeded', ?, 1, ?)`)
      .bind(id('payment-event'), intentId, providerEventId, intent.amount_thousands, now),
    db.prepare(`UPDATE payment_intents SET status = 'paid', updated_at = ? WHERE id = ?`).bind(now, intentId),
    db.prepare(`UPDATE bookings SET payment_status = 'paid', reservation_status = 'confirmed', updated_at = ? WHERE id = ?`)
      .bind(now, intent.booking_id),
    db.prepare(`INSERT INTO booking_events (id, booking_id, event_type, from_value, to_value, actor_user_id, safe_note, created_at)
      VALUES (?, ?, 'payment_status', 'pending', 'paid', ?, 'پرداخت مصنوعی محلی تأیید شد', ?)`)
      .bind(id('event'), intent.booking_id, actor.id, now),
  ]);
  return { intentId, status: 'paid', bookingId: intent.booking_id, replay: false };
}

export async function adminOverview(actor: Actor) {
  if (actor.role !== 'admin') throw new AppError('admin_required', 'دسترسی مدیر لازم است.', 403);
  const [bookings, summary, popular, notifications, audits] = await Promise.all([
    listBookings(actor, true),
    queryFirst<{ total_bookings: number; held: number; confirmed: number; paid_thousands: number; quote_required: number }>(`
      SELECT COUNT(*) AS total_bookings,
        SUM(CASE WHEN reservation_status='held' THEN 1 ELSE 0 END) AS held,
        SUM(CASE WHEN reservation_status='confirmed' THEN 1 ELSE 0 END) AS confirmed,
        COALESCE(SUM(CASE WHEN payment_status='paid' THEN subtotal_thousands ELSE 0 END),0) AS paid_thousands,
        SUM(quote_required) AS quote_required FROM bookings`),
    queryAll<{ item_name_snapshot: string; requested: number; revenue_thousands: number }>(`
      SELECT bl.item_name_snapshot, SUM(bl.quantity) AS requested,
        COALESCE(SUM(CASE WHEN b.payment_status='paid' THEN bl.total_thousands ELSE 0 END),0) AS revenue_thousands
      FROM booking_lines bl JOIN bookings b ON b.id=bl.booking_id
      GROUP BY bl.item_name_snapshot ORDER BY requested DESC`),
    queryAll('SELECT * FROM notification_jobs ORDER BY due_at LIMIT 30'),
    queryAll('SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 30'),
  ]);
  return { summary, bookings, popular, notifications, audits };
}

export async function adminTransition(actor: Actor, bookingId: string, raw: Record<string, unknown>) {
  if (actor.role !== 'admin') throw new AppError('admin_required', 'دسترسی مدیر لازم است.', 403);
  const field = raw.field;
  const allowed: Record<string, string[]> = {
    reservation_status: ['held', 'confirmed', 'fulfilled', 'returned', 'closed', 'cancelled', 'expired'],
    payment_status: ['not_started', 'pending', 'paid', 'failed', 'cancelled', 'partially_refunded', 'refunded'],
    fulfilment_status: ['unscheduled', 'scheduled', 'handed_over', 'returned', 'missed', 'cancelled'],
  };
  if (typeof field !== 'string' || !allowed[field]) throw new AppError('invalid_field', 'فیلد وضعیت معتبر نیست.');
  const value = safeText(raw.value, 40);
  if (!allowed[field].includes(value)) throw new AppError('invalid_transition', 'وضعیت مقصد معتبر نیست.');
  const detail = await getBooking(actor, bookingId);
  const previous = String((detail.booking as unknown as Record<string, unknown>)[field]);
  const db = await ensureDatabase();
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(`UPDATE bookings SET ${field} = ?, updated_at = ? WHERE id = ?`).bind(value, now, bookingId),
    db.prepare(`INSERT INTO booking_events (id, booking_id, event_type, from_value, to_value, actor_user_id, safe_note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'تغییر وضعیت توسط مدیر', ?)`)
      .bind(id('event'), bookingId, field, previous, value, actor.id, now),
    db.prepare(`INSERT INTO audit_events (id, actor_user_id, entity_type, entity_id, action, result_code, correlation_id, created_at)
      VALUES (?, ?, 'booking', ?, ?, ?, ?, ?)`)
      .bind(id('audit'), actor.id, bookingId, `transition:${field}`, value, id('correlation'), now),
  ]);
  return { bookingId, field, from: previous, to: value };
}

export async function saveChecklist(actor: Actor, bookingId: string, raw: Record<string, unknown>) {
  const detail = await getBooking(actor, bookingId);
  const phase = raw.phase === 'return' ? 'return' : 'handoff';
  if (actor.role !== 'admin' && phase !== 'return') throw new AppError('admin_required', 'ثبت تحویل اولیه توسط مدیر انجام می‌شود.', 403);
  const summary = safeText(raw.conditionSummary, 500);
  if (summary.length < 3) throw new AppError('summary_required', 'وضعیت تجهیزات را ثبت کنید.');
  const damage = raw.damageThousands === undefined ? 0 : Number(raw.damageThousands);
  if (!Number.isInteger(damage) || damage < 0 || damage > 100_000) throw new AppError('invalid_damage', 'مبلغ خسارت معتبر نیست.');
  const db = await ensureDatabase();
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(`INSERT INTO handoff_checklists
      (id, booking_id, phase, condition_summary, confirmed_by_user_id, damage_thousands, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(booking_id, phase) DO UPDATE SET condition_summary=excluded.condition_summary,
        confirmed_by_user_id=excluded.confirmed_by_user_id, damage_thousands=excluded.damage_thousands, created_at=excluded.created_at`)
      .bind(id('checklist'), bookingId, phase, summary, actor.id, damage, now),
    db.prepare(`UPDATE bookings SET fulfilment_status = ?, reservation_status = ?, updated_at = ? WHERE id = ?`)
      .bind(phase === 'handoff' ? 'handed_over' : 'returned', phase === 'handoff' ? 'fulfilled' : 'returned', now, bookingId),
    db.prepare(`INSERT INTO booking_events (id, booking_id, event_type, from_value, to_value, actor_user_id, safe_note, created_at)
      VALUES (?, ?, 'handoff_checklist', NULL, ?, ?, ?, ?)`)
      .bind(id('event'), bookingId, phase, actor.id, summary.slice(0, 100), now),
  ]);
  return { bookingId: detail.booking.id, phase, damageThousands: damage };
}

export async function processNotificationJobs(actor: Actor) {
  if (actor.role !== 'admin') throw new AppError('admin_required', 'دسترسی مدیر لازم است.', 403);
  const db = await ensureDatabase();
  const due = await queryAll<{ id: string; channel: string }>(`
    SELECT id, channel FROM notification_jobs WHERE status IN ('pending','retry') AND due_at <= ? ORDER BY due_at LIMIT 50`, new Date().toISOString());
  const now = new Date().toISOString();
  let sent = 0;
  let blocked = 0;
  for (const job of due) {
    const synthetic = job.channel === 'in_app' || process.env.NODE_ENV !== 'production';
    await db.prepare(`UPDATE notification_jobs SET status=?, attempts=attempts+1, last_error_code=?, updated_at=? WHERE id=?`)
      .bind(synthetic ? 'sent' : 'blocked_configuration', synthetic ? '' : 'provider_not_configured', now, job.id).run();
    if (synthetic) sent += 1;
    else blocked += 1;
  }
  return { processed: due.length, sent, blocked };
}
