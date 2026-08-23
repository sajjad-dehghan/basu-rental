# BASU Rental system architecture

Status: accepted for implementation under `ENGPLAN-EVT-20260823-001`.

## Context and boundaries

BASU Rental is one Persian, RTL, responsive web application deployed through OpenAI Sites on Cloudflare. It owns the full rental lifecycle from catalog discovery to return and damage reconciliation.

The deployable unit contains:

- Next.js pages and server components for public, customer, and administrator experiences;
- server actions and route handlers as the only write boundary;
- domain services for pricing, interval availability, booking, payment, waitlist, fulfilment, notification, and analytics;
- Cloudflare D1 as the source of truth for structured state;
- Cloudflare R2 for handoff and return media;
- platform authentication for identity, plus application-owned server-side role and BASU-membership records;
- an outbox for retryable reminders and integration events;
- structured audit and operational events without sensitive payloads.

Browser state may hold presentation preferences and an unfinished booking draft. It is never the source of truth for price, role, inventory, booking, payment, fulfilment, or file ownership.

## User surfaces

| Surface | Routes | Authority |
| --- | --- | --- |
| Public catalog and availability | `/`, `/equipment`, `/equipment/[slug]`, `/availability` | anonymous read of published inventory and public prices |
| Booking and payment | `/book`, `/book/review`, `/book/complete`, `/api/payments/*` | authenticated customer; all totals recomputed server-side |
| Customer self-service | `/account`, `/account/bookings/[id]`, calendar download | booking owner only |
| Administration | `/admin`, `/admin/calendar`, `/admin/bookings`, `/admin/inventory`, `/admin/finance`, `/admin/analytics` | explicit application `admin` role only |
| Operations | health/readiness, protected reminder processor, protected file access | platform or admin capability; fail closed |

Every protected loader and mutation calls the same server authorization service. Hiding a link is not authorization.

## Layering

1. Route/UI layer parses presentation input and renders explicit loading, empty, error, and success states.
2. Application layer starts use cases, authorizes the actor, validates commands, sets an idempotency key, and returns stable result codes.
3. Domain layer owns state transitions, price rules, interval semantics, and invariants without framework dependencies.
4. Repository layer owns SQL, D1 batches/transactions, R2 object metadata, and read models.
5. Integration adapters translate payment and notification providers. Synthetic adapters implement the same interface; missing production configuration fails closed.

No UI or integration adapter writes D1/R2 directly.

## Core domain model

### Catalog and pricing

- `equipment`, `equipment_media`, and `inventory_units` describe published rentable items and capacity.
- `price_books`, `price_rules`, and `price_rule_tiers` are effective-dated and versioned.
- A booking line snapshots item label, audience, rule version, unit/tier calculation, quantity, and final amount.
- Gown-tier lookup is deterministic source-order first-match. Quantity 6 currently resolves to the earlier 4–6 row; the overlap remains visible in policy metadata until an owner correction supersedes it.
- Associations with a negotiated price use a `quote_required` rule; the application never fabricates a numeric price.

### Independent state machines

`reservation_status`:

`draft → held → confirmed → fulfilled → returned → closed`, with guarded exits to `cancelled` or `expired`.

`payment_status`:

`not_started → pending → paid`, with guarded alternatives `failed`, `cancelled`, `partially_refunded`, and `refunded`.

`fulfilment_status`:

`unscheduled → scheduled → handed_over → returned`, with `missed` and `cancelled` branches.

`damage_status` and `deposit_status` are separate because returning an item, assessing damage, refunding a deposit, and recognizing revenue are different events.

Transitions are declared as code and validated again by database constraints where practical. Every accepted transition appends an immutable audit event.

### Interval and capacity semantics

- Timestamps are stored as UTC instants and rendered with `Asia/Tehran`.
- Rental intervals are half-open `[start_at, end_at)`, so an item returned at 12:00 can satisfy a booking beginning at 12:00.
- Blackouts, active holds, confirmed bookings, and fulfilment buffers consume capacity.
- A hold has an expiry. Promotion from waitlist and conversion from hold to booking occur under the same capacity guard.
- The final availability check and capacity consumption are one atomic repository operation. A client-side availability response is advisory only.

## Data model groups

- Identity: `users`, `user_roles`, `membership_verifications`, `sessions_projection`.
- Catalog: `equipment`, `equipment_media`, `inventory_units`, `bundles`, `bundle_items`.
- Pricing: `price_books`, `price_rules`, `price_rule_tiers`.
- Booking: `bookings`, `booking_lines`, `booking_events`, `inventory_holds`, `waitlist_entries`, `blackouts`.
- Finance: `payment_intents`, `payment_events`, `refunds`, `deposits`, `damage_charges`.
- Fulfilment: `delivery_slots`, `fulfilments`, `handoff_checklists`, `checklist_items`, `media_objects`.
- Communication: `notification_preferences`, `notification_jobs`, `outbox_events`.
- Operations: `audit_events`, `idempotency_keys`, `policy_versions`, `analytics_daily`.

Foreign keys prevent orphaned financial and fulfilment records. Unique keys enforce provider-event and idempotency replay protection. Indexes cover published catalog, interval overlap candidates, customer booking lists, admin calendar, pending outbox jobs, and analytics time ranges.

## Critical transaction designs

### Create booking

1. Authenticate and authorize the customer.
2. Validate normalized UTC interval, quantities, contact minimum, and audience evidence.
3. Load the effective price rule and recompute every amount server-side.
4. Acquire/verify capacity inside the repository transaction.
5. Create booking, snapshot lines and policy versions, consume the hold, append audit/outbox events, and record the idempotency result.
6. Commit once. On conflict, return a stable `capacity_conflict` result and optionally offer waitlist enrollment.

### Process payment event

1. Authenticate the adapter event and bind it to provider, event ID, intent, amount, and currency.
2. Insert the unique event or return the prior result for replay.
3. Apply only an allowed payment transition; never infer reservation state from a spreadsheet column or provider label.
4. Append audit and outbox events in the same commit.

### Change or cancel booking

One orchestration command applies policy snapshot rules, capacity changes, waitlist promotion, refund intent, fulfilment-slot changes, and notification cancellation. Every sub-operation has the same command idempotency key.

## File security

R2 objects use random opaque keys and private access. D1 stores owner, booking, purpose, media type, byte length, checksum, lifecycle status, and retention deadline. Upload initiation and download authorization are server-side. Allowed MIME types and size limits are checked both before and after upload; unsupported content is rejected. Deletion changes D1 state, removes the object, and records a read-back result. Public catalog media is a distinct published class and never shares handoff access rules.

## Notifications and integrations

Domain events append an outbox row in the same transaction as business state. A protected processor claims due rows, sends through a configured adapter, and records attempt, retry time, result, and deduplication key. The local/synthetic adapter records delivery without contacting anyone. Missing production credentials leaves the job `blocked_configuration`; it is not marked sent. Calendar export is generated directly from the booking snapshot and remains available without an email provider.

## Analytics semantics

- demand counts requested item-days, including an explicit cancelled/fulfilled dimension;
- utilization is consumed capacity divided by published usable capacity in the report timezone;
- gross booking value, paid value, refunds, deposits, damage charges, and net recognized rental revenue are separate measures;
- deposits are liabilities, not revenue;
- empty ranges return zero-valued series with the requested bounds.

Daily aggregates are rebuildable from canonical events and never replace financial source records.

## Security and privacy controls

- server-enforced role, ownership, and membership checks;
- schema validation and normalization at every mutation boundary;
- same-origin/CSRF protections for browser writes and signatures for adapter callbacks;
- request and actor rate limits on booking, payment, upload, and administrative actions;
- no raw payment data, identity evidence, signed URLs, secrets, or customer free text in logs;
- retention and deletion rules for identity evidence, contact details, files, and audit records;
- correlation IDs across request, transaction, outbox, and audit events;
- dependency, secret, static, structural, and negative authorization checks before release.

## Failure, recovery, and rollback

- D1 migrations are forward-only in production and have a tested compensating migration or restore plan before deployment.
- Deployment health failure rolls application code back before any irreversible cleanup.
- New columns/tables are additive first; readers tolerate the prior version during rollout.
- R2 cleanup is asynchronous and retryable, with orphan detection comparing D1 metadata and object listings.
- Payment and notification adapters support reconciliation; local state never claims provider success without a verified event.

## Observability and service objectives

Structured events contain timestamp, severity, environment, service, route/use-case, correlation ID, result code, duration, and safe entity identifiers. Health checks verify application startup; readiness also verifies required bindings without mutating them. Initial objectives are 99.5% successful non-administrative requests, no accepted overbooking, no duplicate payment effect, and p95 catalog/availability response under the defined staging budget.

## Deployment boundary

The application uses the pinned Sites scaffold and its D1, R2, and authentication bindings. Production secrets, payment activation, external notification sending, public visibility, and destructive production operations remain separate gates. A private deployment with synthetic adapters is sufficient for end-to-end technical verification, but not evidence of a live financial-provider contract.

