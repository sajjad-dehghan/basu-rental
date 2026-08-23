import { NextRequest, NextResponse } from 'next/server';
import {
  adminOverview, adminTransition, cancelBooking, catalogWithAvailability, createBooking, getBooking,
  joinWaitlist, listBookings, processNotificationJobs, rescheduleBooking, saveChecklist,
  settleSyntheticPayment, startPayment,
} from '@/app/lib/domain';
import { AppError, getActor, requireActor, requireAdmin, safeText } from '@/app/lib/security';
import { InputError } from '@/app/lib/validation';

export const dynamic = 'force-dynamic';

function ok(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function failure(error: unknown) {
  if (error instanceof AppError || error instanceof InputError) return NextResponse.json({ ok: false, error: { code: error.code, message: error.message } }, { status: error.status });
  console.error('api_error', error);
  return NextResponse.json({ ok: false, error: { code: 'internal_error', message: 'خطای غیرمنتظره رخ داد.' } }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const resource = request.nextUrl.searchParams.get('resource') ?? 'catalog';
    if (resource === 'catalog') return ok(await catalogWithAvailability(
      request.nextUrl.searchParams.get('startAt') ?? undefined,
      request.nextUrl.searchParams.get('endAt') ?? undefined,
    ));
    if (resource === 'session') return ok(await getActor());
    if (resource === 'bookings') return ok(await listBookings(await requireActor()));
    if (resource === 'booking') return ok(await getBooking(await requireActor(), safeText(request.nextUrl.searchParams.get('id'), 100)));
    if (resource === 'admin') return ok(await adminOverview(await requireAdmin()));
    throw new AppError('unknown_resource', 'منبع درخواستی معتبر نیست.', 404);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('content-type')?.includes('application/json') !== true) throw new AppError('json_required', 'نوع درخواست معتبر نیست.', 415);
    const body = await request.json() as Record<string, unknown>;
    const action = safeText(body.action, 80);
    const actor = await requireActor();
    if (action === 'booking.create') return ok(await createBooking(actor, body.payload), 201);
    if (action === 'booking.cancel') return ok(await cancelBooking(actor, safeText(body.bookingId, 100)));
    if (action === 'booking.reschedule') return ok(await rescheduleBooking(actor, safeText(body.bookingId, 100), body.startAt, body.endAt));
    if (action === 'waitlist.join') return ok(await joinWaitlist(actor, (body.payload ?? {}) as Record<string, unknown>), 201);
    if (action === 'payment.start') return ok(await startPayment(actor, safeText(body.bookingId, 100), safeText(body.idempotencyKey, 100)), 201);
    if (action === 'payment.synthetic_settle') return ok(await settleSyntheticPayment(actor, safeText(body.intentId, 100)));
    if (action === 'admin.transition') return ok(await adminTransition(await requireAdmin(), safeText(body.bookingId, 100), body));
    if (action === 'checklist.save') return ok(await saveChecklist(actor, safeText(body.bookingId, 100), body));
    if (action === 'notifications.process') return ok(await processNotificationJobs(await requireAdmin()));
    throw new AppError('unknown_action', 'عملیات درخواستی معتبر نیست.', 404);
  } catch (error) {
    return failure(error);
  }
}
