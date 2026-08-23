import { getChatGPTUser } from '../chatgpt-auth';
import { ensureDatabase, queryFirst } from './db';
export { makeReference, parseIso, positiveInt, safeText } from './validation';

export type Actor = {
  id: string;
  email: string;
  displayName: string;
  role: 'customer' | 'admin';
  basuStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
};

export class AppError extends Error {
  public code: string;
  public status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function getActor(): Promise<Actor | null> {
  const identity = await getChatGPTUser();
  if (!identity) return null;
  const db = await ensureDatabase();
  const now = new Date().toISOString();
  const localAdmin = process.env.NODE_ENV !== 'production' && identity.email.endsWith('@sites.test');
  await db.prepare(`INSERT INTO users (id, email, display_name, role, basu_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'unverified', ?, ?)
    ON CONFLICT(id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name, updated_at = excluded.updated_at`)
    .bind(identity.userId, identity.email.toLowerCase(), identity.displayName, localAdmin ? 'admin' : 'customer', now, now).run();
  const row = await queryFirst<{ id: string; email: string; display_name: string; role: Actor['role']; basu_status: Actor['basuStatus'] }>(
    'SELECT id, email, display_name, role, basu_status FROM users WHERE id = ?', identity.userId,
  );
  if (!row) throw new AppError('identity_sync_failed', 'همگام‌سازی حساب کاربری انجام نشد.', 500);
  return { id: row.id, email: row.email, displayName: row.display_name, role: row.role, basuStatus: row.basu_status };
}

export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw new AppError('authentication_required', 'برای ادامه وارد حساب شوید.', 401);
  return actor;
}

export async function requireAdmin(): Promise<Actor> {
  const actor = await requireActor();
  if (actor.role !== 'admin') throw new AppError('admin_required', 'این بخش فقط برای مدیر سامانه است.', 403);
  return actor;
}
