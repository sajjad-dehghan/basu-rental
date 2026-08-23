import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { makeReference, parseIso, positiveInt, safeText } from '../app/lib/validation.ts';

describe('مرزهای اعتبارسنجی ورودی', () => {
  it('متن خالی و بیش‌ازحد بلند را رد می‌کند', () => {
    assert.equal(safeText('   ', 20), '');
    assert.equal(safeText('الف'.repeat(21), 20).length, 20);
    assert.equal(safeText('  جشن دانش‌آموختگی  ', 30), 'جشن دانش‌آموختگی');
  });

  it('عدد صحیح مثبت را enforce می‌کند', () => {
    assert.equal(positiveInt(3, 10), 3);
    assert.throws(() => positiveInt(-1, 10));
    assert.throws(() => positiveInt(11, 10));
  });

  it('تاریخ نامعتبر را رد و شناسه رزرو غیرقابل حدس می‌سازد', () => {
    assert.throws(() => parseIso('not-a-date', 'شروع'));
    assert.equal(parseIso('2026-08-23T10:00:00.000Z', 'شروع'), '2026-08-23T10:00:00.000Z');
    assert.match(makeReference(), /^BR-\d{4}-[A-Z0-9]{8}$/);
  });
});
