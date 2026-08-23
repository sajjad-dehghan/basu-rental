# Open Development Operations OS

This repository owns implementation, technical architecture, engineering evidence, and environment state for **Basu Rental App**. Product Operations owns product intent, priority, acceptance criteria, and human acceptance.

## Contract flow

```text
approved product request -> content-addressed intake -> multi-discipline engineering plan -> implementation -> quality gates -> independent engineering verification -> result contract -> product validation
```

No private chat or mutable ticket field replaces a versioned contract. Development cannot change product scope, and Product Operations cannot invent engineering completion.

## Proportional delivery

The approved outcome is the stop condition. Understand the affected flow, then stop at the first viable solution: no build, repository reuse, standard-library or native-platform capability, installed capability, then minimum local code. Prefer deletion, boring code, and the fewest affected files. New complexity requires a present need, a simpler alternative that is insufficient now, its ongoing cost, and a removal or expansion trigger. A deliberate shortcut records its ceiling and observable upgrade trigger. Assurance depth follows impact; trust-boundary validation, data-loss handling, security, accessibility, scope, evidence, independent verification, and human authority remain mandatory.
