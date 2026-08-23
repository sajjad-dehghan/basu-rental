# ADR-001: One Sites application with D1, R2, and platform authentication

- Status: accepted
- Date: 2026-08-23
- Request: `DEVREQ-EVT-20260823-001`

## Decision

Deploy one Next.js application through OpenAI Sites. Use D1 for structured state, R2 for binary media, and platform authentication for identity. Application roles, BASU membership, pricing, inventory, booking, finance, fulfilment, analytics, and audit remain application-owned server data.

## Why

The approved product is one connected rental workflow. Splitting it into services before load or team boundaries demand that split would add distributed transactions exactly where capacity and payment consistency matter most. A modular monolith preserves atomic use cases, simple deployment, and one audit chain while retaining internal adapter and repository boundaries.

An in-memory or browser-only implementation cannot meet persistence, concurrency, RBAC, audit, recovery, or admin requirements. Storing media in D1 would inflate rows and weaken object lifecycle controls. Treating identity as authorization would make every authenticated user an administrator.

## Consequences

- Domain modules must not bypass repositories or authorization.
- D1 transaction limitations shape booking and outbox operations; concurrency tests are release-blocking.
- R2 metadata and D1 object records require reconciliation and retention jobs.
- The application can later extract modules only when measured scale, ownership, or isolation requires it.

## Expansion trigger

Extract a separate worker/service only when a measured queue, throughput, independent deployment, or security-isolation requirement cannot be met within the Sites application. Preserve event and idempotency contracts during extraction.

