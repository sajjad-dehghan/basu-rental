const labels: Record<string, string> = {
  draft: "پیش‌نویس",
  held: "در انتظار پرداخت",
  confirmed: "تأییدشده",
  fulfilled: "تحویل‌شده",
  returned: "بازگشته",
  closed: "بسته",
  cancelled: "لغوشده",
  expired: "منقضی",
  not_started: "شروع نشده",
  pending: "در حال بررسی",
  paid: "پرداخت‌شده",
  failed: "ناموفق",
  partially_refunded: "بازپرداخت جزئی",
  refunded: "بازپرداخت‌شده",
  unscheduled: "زمان‌بندی نشده",
  scheduled: "زمان‌بندی‌شده",
  handed_over: "تحویل شده",
  missed: "از دست رفته",
  waiting: "در صف انتظار",
  offered: "پیشنهاد فعال",
  sent: "ارسال‌شده",
  retry: "تلاش مجدد",
  blocked_configuration: "نیازمند اتصال سرویس",
  delivery_fee_pending: "هزینه ارسال در حال بررسی",
  delivery_fee_finalized: "هزینه ارسال نهایی‌شده",
};
export function StatusPill({ value }: { value: string }) {
  return (
    <span className={`status-pill status-${value}`}>
      {labels[value] ?? value}
    </span>
  );
}
