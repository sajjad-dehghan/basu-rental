# Communication protocol

## Durable coordination

The taskboard and committed handoffs are authoritative. Chat, email, and meetings may notify people,
but they do not change ownership, status, scope, approval, or completion unless the durable record
is updated.

## New work

Send new events to `RB-01`. The coordinator creates owner-scoped tasks and dependencies. Specialists
do not directly assign work across boundaries or silently expand their own task.

## Handoff contract

Every handoff contains:

- handoff, event, source task, destination role, and related record identifiers;
- completed outputs and canonical paths;
- factual state and exact remaining work;
- dependencies, blockers, risks, human gates, and expected return signal;
- evidence and verification references;
- a declaration that no secret value is included.

The receiving owner acknowledges by moving its task to the catalog's active task status. It does
not rewrite the sender's historical handoff.

## Blocked work

Record the exact blocked reason, dependency identifier, next owner role, and observable unblock
condition. Return control to `RB-01`. Do not mark blocked work done, invent missing results, or use a
private message as the only recovery record.

## Human decisions

Prepare a concise decision brief with options, recommendation, tradeoffs, deadline, and default
consequence. Only an explicit, attributed human disposition changes decision status. Silence is not
approval.

## Completion signal

A specialist returns:

```text
task_id
status from catalog
canonical artifact references
evidence references
verification required
known risks
next owner role
```

Completion means the task's done conditions are demonstrably met. It does not mean the producer
independently certified its work.

## Security

Never paste or commit secret values, private URLs, personal data, production payloads, or
proprietary evidence. If runtime access is required, cite only an approved alias using the catalog's
secret-reference format.
