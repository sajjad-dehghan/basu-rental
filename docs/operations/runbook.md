# راهنمای عملیات BASU Rental

## سرویس و وابستگی‌ها

- Runtime: Vinext روی OpenAI Sites / Cloudflare Workers.
- دیتابیس: D1 با binding به نام `DB`.
- فایل خصوصی: R2 با binding به نام `FILES`.
- هویت: `getChatGPTUser()`؛ نقش و وضعیت بوعلی فقط از جدول `users` خوانده می‌شود.
- timezone نمایش: `Asia/Tehran`؛ زمان‌ها در دیتابیس ISO-8601 UTC هستند.

## سلامت و مشاهده‌پذیری

- `GET /api/health` باید `200` و `ok: true` برگرداند.
- خطاهای API با کد امن و correlation-friendly ثبت می‌شوند و stack trace به مشتری برنمی‌گردد.
- عملیات مهم در `booking_events` و `audit_events` ثبت می‌شوند.
- صف `notification_jobs` بدون provider خارجی در production به حالت `blocked_configuration` می‌رود؛ ارسال جعلی production وجود ندارد.

## بازیابی و رخداد

1. سلامت deployment و bindingهای D1/R2 را بررسی کنید.
2. migrationهای `dist/.openai/drizzle` را با نسخه deployment تطبیق دهید.
3. برای خطای ظرفیت، رزروهای فعال همان تجهیز و بازه را بررسی کنید؛ ظرفیت را دستی دور نزنید.
4. برای اختلاف پرداخت، `payment_intents` و `payment_events` را با provider reference تطبیق دهید؛ وضعیت را بدون رویداد ممیزی تغییر ندهید.
5. برای بازگشت نسخه، deployment قبلی را promote کنید؛ migrationهای این نسخه فقط افزایشی و `IF NOT EXISTS` هستند.

## نگهداری

- فایل‌های مدرک تحویل/بازگشت حداکثر ۵ مگابایت و فقط JPG/PNG/WebP هستند.
- `retention_until` مبنای job پاک‌سازی R2 است؛ حذف باید ابتدا وضعیت metadata را تغییر دهد و سپس object را پاک کند.
- کلید idempotency رزرو و پرداخت باید برای retry ثابت بماند.
