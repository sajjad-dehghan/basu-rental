# ADR-003: Fail-closed payment and notification adapters

- Status: accepted
- Date: 2026-08-23
- Request: `DEVREQ-EVT-20260823-001`

## Decision

Payment and notification integrations implement explicit server-side adapter contracts. Local synthetic adapters exercise complete state, idempotency, retry, reconciliation, and audit behavior without external writes. Production adapters activate only when required configuration and secrets are present and verified; otherwise operations return `blocked_configuration` and never simulate provider success.

## Why

No production provider agreement or credentials are available in the repository. Hard-coded success paths would manufacture financial evidence, while omitting the interfaces would leave the final workflow structurally incomplete.

## Consequences

- Provider events are authenticated, amount-bound, uniquely recorded, and replay-safe.
- Adapter outputs are never trusted without server transition guards.
- Release evidence distinguishes complete integration behavior from external provider activation.
- Public/production activation remains a human gate.

## Removal trigger

The synthetic adapter remains as a test fixture after production activation. It may be removed from runtime selection only after integration tests have an equally deterministic replacement.
