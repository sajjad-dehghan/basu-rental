import { env } from 'cloudflare:workers';
import { CATALOG, GOWN_TIERS, SOURCE_WORKBOOK } from './catalog';
import { SCHEMA_STATEMENTS } from './schema';

let initialization: Promise<void> | undefined;

export function getD1(): D1Database {
  if (!env.DB) throw new Error('D1 binding DB is unavailable.');
  return env.DB;
}

export function getFiles(): R2Bucket {
  if (!env.FILES) throw new Error('R2 binding FILES is unavailable.');
  return env.FILES;
}

export async function ensureDatabase(): Promise<D1Database> {
  const db = getD1();
  initialization ??= initialize(db).catch((error) => {
    initialization = undefined;
    throw error;
  });
  await initialization;
  return db;
}

async function initialize(db: D1Database): Promise<void> {
  await db.batch(SCHEMA_STATEMENTS.map((statement) => db.prepare(statement)));
  const now = new Date().toISOString();
  const equipmentSeeds = CATALOG.map((item) => db.prepare(
    `INSERT OR IGNORE INTO equipment
      (id, slug, name, category, description, capacity, published, public_price_thousands, basu_price_thousands, accent, source_ref, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
  ).bind(item.id, item.slug, item.name, item.category, item.description, item.capacity,
    item.publicThousands, item.basuThousands, item.accent, SOURCE_WORKBOOK, now));
  const tierSeeds = GOWN_TIERS.map((tier) => db.prepare(
    `INSERT OR IGNORE INTO price_tiers
      (id, equipment_id, min_quantity, max_quantity, priority, public_price_thousands, basu_price_thousands, note, effective_at)
     VALUES (?, 'eq-gown', ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(`tier-gown-${tier.priority}`, tier.min, tier.max, tier.priority,
    tier.publicThousands, tier.basuThousands, tier.note, now));
  const policySeeds = [
    db.prepare(`INSERT OR IGNORE INTO policy_versions
      (id, policy_type, version, config_json, effective_at, active)
      VALUES ('policy-rental-v1', 'rental', '1', ?, ?, 1)`).bind(JSON.stringify({
        cancellationHours: 24, holdMinutes: 20, interval: 'half-open', timezone: 'Asia/Tehran',
      }), now),
    db.prepare(`INSERT OR IGNORE INTO policy_versions
      (id, policy_type, version, config_json, effective_at, active)
      VALUES ('policy-price-v1', 'pricing', '1', ?, ?, 1)`).bind(JSON.stringify({
        source: SOURCE_WORKBOOK, gownOverlap: 'source-order-first-match', quoteRequired: 'public quantity 20-30',
      }), now),
  ];
  await db.batch([...equipmentSeeds, ...tierSeeds, ...policySeeds]);
  await db.prepare('PRAGMA optimize').run();
}

export async function queryAll<T>(statement: string, ...values: unknown[]): Promise<T[]> {
  const db = await ensureDatabase();
  const result = await db.prepare(statement).bind(...values).all<T>();
  return result.results ?? [];
}

export async function queryFirst<T>(statement: string, ...values: unknown[]): Promise<T | null> {
  const db = await ensureDatabase();
  return db.prepare(statement).bind(...values).first<T>();
}

