'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusPill } from '../components/status-pill';

type AdminBooking = { id: string; reference: string; event_title: string; start_at: string; item_summary: string; reservation_status: string; payment_status: string; customer_name: string };
type PopularItem = { item_name_snapshot: string; requested: number };
type NotificationItem = { id: string; template: string; due_at: string; status: string; attempts: number };
type AuditItem = { id: string; action: string; entity_type: string; entity_id: string; result_code: string };
type Overview = { summary: Record<string, number>; bookings: AdminBooking[]; popular: PopularItem[]; notifications: NotificationItem[]; audits: AuditItem[] };
type OverviewResponse = { ok: true; data: Overview } | { ok: false; error?: { message?: string } };
type BasicResponse = { ok: boolean; error?: { message?: string } };
type View = 'calendar' | 'bookings' | 'analytics' | 'operations';

export function AdminDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [view, setView] = useState<View>('calendar');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/app?resource=admin', { cache: 'no-store' });
      const result = (await response.json()) as OverviewResponse;
      if (!result.ok) throw new Error(result.error?.message ?? 'دریافت داشبورد انجام نشد.');
      setData(result.data);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'خطا');
    }
  }, []);

  useEffect(() => {
    // Initial remote-state synchronization; updates happen after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function post(payload: Record<string, unknown>, key: string) {
    setBusy(key);
    try {
      const response = await fetch('/api/app', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = (await response.json()) as BasicResponse;
      if (!result.ok) throw new Error(result.error?.message ?? 'عملیات انجام نشد.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'خطا');
    } finally {
      setBusy('');
    }
  }

  const max = useMemo(() => Math.max(1, ...(data?.popular ?? []).map((item) => Number(item.requested))), [data]);
  if (!data) return <section className="account-shell">{error ? <div className="form-message error">{error}</div> : <div className="skeleton-card" />}</section>;

  return (
    <section className="admin-shell">
      <div className="admin-tabs" role="tablist">
        {([['calendar', 'تقویم تعارض'], ['bookings', 'رزروها'], ['analytics', 'تحلیل'], ['operations', 'عملیات']] as const).map(([id, label]) => <button role="tab" aria-selected={view === id} className={view === id ? 'active' : ''} onClick={() => setView(id)} key={id}>{label}</button>)}
      </div>
      {error && <div className="form-message error">{error}</div>}
      <div className="metric-grid">
        <article><span>کل رزروها</span><strong>{Number(data.summary.total_bookings ?? 0).toLocaleString('fa-IR')}</strong><small>همه وضعیت‌ها</small></article>
        <article><span>نیازمند اقدام</span><strong>{Number(data.summary.held ?? 0).toLocaleString('fa-IR')}</strong><small>رزروهای hold</small></article>
        <article><span>پرداخت‌شده</span><strong>{Number(data.summary.paid_thousands ?? 0).toLocaleString('fa-IR')}</strong><small>هزار تومان</small></article>
        <article><span>استعلام قیمت</span><strong>{Number(data.summary.quote_required ?? 0).toLocaleString('fa-IR')}</strong><small>قیمت توافقی</small></article>
      </div>
      {view === 'calendar' && <div className="calendar-board"><div className="calendar-head"><h2>تقویم تعارض و تحویل</h2><span>بازه‌های فعال · Asia/Tehran</span></div>{data.bookings.map((booking) => <article key={booking.id}><div><small>{booking.reference}</small><b>{booking.event_title}</b><span>{new Date(booking.start_at).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' })}</span></div><p>{booking.item_summary}</p><StatusPill value={booking.reservation_status} /><Link href={`/account/bookings/${booking.id}`}>بازکردن ←</Link></article>)}</div>}
      {view === 'bookings' && <div className="admin-table"><div className="table-head"><span>رزرو</span><span>مشتری</span><span>وضعیت رزرو</span><span>پرداخت</span><span>عملیات</span></div>{data.bookings.map((booking) => <div className="table-row" key={booking.id}><span><b>{booking.reference}</b><small>{booking.event_title}</small></span><span>{booking.customer_name}</span><StatusPill value={booking.reservation_status} /><StatusPill value={booking.payment_status} /><span className="admin-actions"><select aria-label={`وضعیت ${booking.reference}`} defaultValue={booking.reservation_status} onChange={(event) => void post({ action: 'admin.transition', bookingId: booking.id, field: 'reservation_status', value: event.target.value }, booking.id)} disabled={busy === booking.id}><option value="held">hold</option><option value="confirmed">تأیید</option><option value="fulfilled">تحویل</option><option value="returned">بازگشت</option><option value="closed">بستن</option><option value="cancelled">لغو</option></select><Link href={`/account/bookings/${booking.id}`}>جزئیات</Link></span></div>)}</div>}
      {view === 'analytics' && <div className="analytics-grid"><article className="panel demand-chart"><h2>تقاضا بر اساس تجهیز</h2>{data.popular.length ? data.popular.map((item) => <div className="bar-row" key={item.item_name_snapshot}><span>{item.item_name_snapshot}</span><i><b style={{ width: `${Math.max(4, Number(item.requested) / max * 100)}%` }} /></i><strong>{Number(item.requested).toLocaleString('fa-IR')}</strong></div>) : <p className="empty-copy">هنوز داده‌ای برای این بازه وجود ندارد.</p>}</article><article className="panel finance-notes"><h2>تعریف شاخص‌ها</h2><p><b>درآمد پرداخت‌شده</b> فقط رزروهایی با payment_status=paid را جمع می‌کند.</p><p><b>ودیعه</b> درآمد نیست و در این عدد نمی‌آید.</p><p><b>لغو و بازپرداخت</b> در نماهای مستقل نگهداری می‌شوند.</p></article></div>}
      {view === 'operations' && <div className="operations-grid"><article className="panel"><div className="panel-head"><div><h2>صف اعلان</h2><p>ارسال خارجی بدون تنظیم provider مسدود می‌ماند.</p></div><button onClick={() => void post({ action: 'notifications.process' }, 'notifications')} disabled={Boolean(busy)}>{busy === 'notifications' ? 'در حال پردازش…' : 'پردازش موعدها'}</button></div>{data.notifications.map((notification) => <div className="operation-row" key={notification.id}><span>{notification.template}<small>{new Date(notification.due_at).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}</small></span><StatusPill value={notification.status} /><b>{Number(notification.attempts).toLocaleString('fa-IR')} تلاش</b></div>)}</article><article className="panel"><h2>آخرین رویدادهای ممیزی</h2>{data.audits.map((audit) => <div className="operation-row" key={audit.id}><span>{audit.action}<small>{audit.entity_type} · {audit.entity_id.slice(0, 18)}</small></span><b>{audit.result_code}</b></div>)}</article></div>}
    </section>
  );
}
