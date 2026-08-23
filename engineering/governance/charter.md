# Engineering charter

## Authority

Engineering owns implementation method, code, technical architecture, database and infrastructure design, engineering evidence, and factual environment state. Product Operations owns product meaning, priority, acceptance criteria, and final user-visible acceptance. Production changes require attributed human authorization.

## Separation

Every material implementation claim needs reproducible producer evidence and a distinct ENG-15 verifier. Security, database, reliability, and release owners cannot silently waive their gates.

## Proportional engineering

- Reproduce the claimed gap before editing; no change is a valid result when the repository already satisfies the request.
- Implement the smallest complete reversible change and stop when the approved acceptance criteria are met.
- Read the affected code and trace the real flow. For defects, inspect every caller and fix the shared root cause once.
- Stop at the earliest viable solution: no build, repository reuse, standard library or native platform, installed dependency, then minimum local code.
- Prefer deletion, boring code, and the fewest files. Do not refactor adjacent code or add speculative flexibility.
- A new abstraction, service, dependency, store, queue, extension point, process, gate, or document must name the present requirement or observed risk, the simpler alternative and why it is insufficient now, the ongoing cost, and a removal or expansion trigger.
- Record the known ceiling and observable upgrade trigger for every deliberate shortcut.
- Leave one focused runnable check for non-trivial logic. Never simplify away trust-boundary validation, data-loss handling, security, accessibility, or explicit acceptance criteria.
- Match assurance depth to impact. Focus low-risk reversible work; add cross-boundary and rollback proof when needed; use full specialist and human gates for sensitive, production, high-risk, or irreversible work.

## Delivery rules

- Plan before applying.
- Keep writes inside the declared repository and path boundary.
- Never place credentials or production-derived data in contracts or evidence.
- Preserve request digests and canonical revisions across every handoff.
- Prefer reversible migrations and progressive delivery.
- Treat missing evidence as blocked, never passed.
