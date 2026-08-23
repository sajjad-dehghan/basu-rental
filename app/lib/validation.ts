export class InputError extends Error {
  public code: string;
  public status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function safeText(value: unknown, max = 180): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function positiveInt(value: unknown, max = 100): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) throw new InputError('invalid_quantity', 'تعداد واردشده معتبر نیست.');
  return parsed;
}

export function parseIso(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new InputError('invalid_date', `${field} معتبر نیست.`);
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new InputError('invalid_date', `${field} معتبر نیست.`);
  return date.toISOString();
}

export function makeReference(): string {
  return `BR-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
