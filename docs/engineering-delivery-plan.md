# BASU Rental final delivery plan

This plan coordinates `DEVREQ-EVT-20260823-001` and does not reduce the approved scope to an MVP.

## Delivery sequence

1. `WS-01` fixes sequencing, evidence, blockers, and acceptance-criteria traceability.
2. `WS-02` defines the system boundaries, domain state machines, concurrency model, D1/R2/auth contracts, and reversible decisions.
3. `WS-03`, `WS-04`, `WS-06`, `WS-07`, `WS-08`, `WS-11`, `WS-12`, and `WS-13` implement their independent slices after the architecture is sealed. `WS-05` records the responsive web/PWA client disposition; native clients are a declared non-goal.
4. `WS-09` performs the integrated security, privacy, identity, and supply-chain review after all implementation slices exist.
5. `WS-10` executes the full unit, integration, end-to-end, accessibility, migration, and deployment test matrix.
6. `WS-14` freezes operating, architecture, migration, support, and rollback documentation against the tested revision.
7. `WS-15` independently reproduces material claims without changing producer output.

## Acceptance traceability

| Scope | Criteria | Primary workstreams | Decisive evidence |
| --- | --- | --- | --- |
| Catalog, dual pricing, availability, atomic booking | AC-01, AC-02 | WS-02, WS-04, WS-06 | price fixtures, boundary tests, concurrency read-back |
| Identity, customer self-service, admin operations | AC-03, AC-05, AC-06 | WS-03, WS-04, WS-09 | server authorization matrix, E2E traces, audit events |
| Payment state and idempotency | AC-04 | WS-02, WS-04, WS-09 | signed synthetic webhook tests and database read-back |
| Delivery, return, files, damage | AC-07, AC-08 | WS-03, WS-04, WS-06, WS-08 | slot tests, protected object access, handoff E2E |
| Ten differentiators, reminders, analytics | AC-09, AC-10, AC-11 | WS-03, WS-04, WS-07, WS-11 | 10/10 capability matrix, queue tests, reference aggregates |
| Persistence and storage | AC-12 | WS-06, WS-08 | forward migration, constraints, restore/delete evidence |
| RTL, accessibility, SEO, telemetry, performance | AC-13, AC-15 | WS-03, WS-11, WS-13 | accessibility report, keyboard review, SEO and health checks |
| Security, reproducible delivery, release | AC-14, AC-16 | WS-09, WS-10, WS-12, WS-14, WS-15 | scans, test reports, build/deploy/rollback record, independent disposition |

Every workstream carries the two owner conditions: deliver the final version rather than an MVP, and continue the complete scope through the endpoint.

## Current blockers and controls

- The pinned Sites scaffold currently cannot install because the dependency minimum-release-age policy rejects `fast-uri@3.1.6` until its natural eligibility time. The version and policy must not be changed or bypassed. Recheck with the locked package-manager install before the first preview.
- Production payment activation needs an external provider agreement and secrets. The complete provider interface, synthetic adapter, state machine, reconciliation, and fail-closed configuration are in scope; production activation is a separate human gate.
- Cancellation, refund, deposit, damage, and BASU-membership policies are configuration-driven and versioned because final legal text has not been supplied. Reservations snapshot the applicable version.
- The historical spreadsheet has overlapping gown tiers at quantity 6. Until a product-policy correction is recorded, the deterministic source-order first-match rule is used and tested explicitly.
- `validation_plan_id` in the product ticket uses the stale `VAL-...` projection while the canonical validation record is `VPL-20260823-001`. Verification must keep this lineage discrepancy visible until controlled correction.

## Evidence discipline

Each workstream records its canonical revision, exact commands, environment, changed components, inspectable outputs, known limitations, and no production-derived customer data. Only `ENG-15` may issue the independent verification disposition. Production release remains separately gated.
