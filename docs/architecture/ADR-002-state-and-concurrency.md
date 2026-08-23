# ADR-002: Independent state machines and atomic interval capacity

- Status: accepted
- Date: 2026-08-23
- Request: `DEVREQ-EVT-20260823-001`

## Decision

Model reservation, payment, fulfilment, deposit, and damage as independent guarded state machines. Store time in UTC, apply `Asia/Tehran` for business/display rules, and treat rental intervals as half-open. The final capacity check and consumption occur in one repository transaction protected by database constraints and idempotency keys.

## Why

The spreadsheet contains an operational label in the payment column, proving a single combined status is ambiguous. Payment callbacks and physical return events occur independently. Client-side availability checks race when two customers request the last capacity.

## Consequences

- UI read models combine states without collapsing their source fields.
- Every command declares allowed transitions and appends an audit event.
- Payment replay, capacity race, waitlist promotion, timezone boundaries, change, and cancellation require integration tests.
- Historical rows without year/time are not imported as live availability.

## Reversal

This decision is additive. New states can be introduced with compatible readers and migration. Collapsing states later is not safe because it would discard audit meaning.

