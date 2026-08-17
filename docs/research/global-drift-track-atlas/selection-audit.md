# Selection audit

Audit date: 2026-08-17

## Exact counts

- Candidate register: **81** real event/venue/year identity instances.
- Selected: **50**.
- Ranked backups: **15**.
- Additional reserve/candidate-only: **16**.
- Per-track research files: **65** (selected + ranked backups).
- Source-register rows: **169**.

## Regional quota

| Region | Required | Actual | Status |
|---|---:|---:|---|
| Japan | 10 | 10 | PASS |
| North America | 10 | 10 | PASS |
| Europe | 12 | 12 | PASS |
| Oceania | 5 | 5 | PASS |
| Asia (excluding Japan) | 6 | 6 | PASS |
| Latin America (excluding Mexico) | 4 | 4 | PASS |
| Middle East and Africa | 3 | 3 | PASS |

## Event-tier quota

| Tier | Required | Actual | Status |
|---|---:|---:|---|
| International / continental top | 28 | 28 | PASS |
| Mature national | 16 | 16 | PASS |
| Historic / independent invitation | 6 | 6 | PASS |

## Diversity constraints

| Constraint | Required | Actual | Status |
|---|---:|---:|---|
| Different countries/regions | ≥20 | 29 | PASS |
| Different venues | ≥30 | 49 | PASS |
| Temporary/street/parking/stadium courses | ≥10 | 13 | PASS |
| Any single series | ≤10 | 7 | PASS |
| Any single country | ≤10 | 10 | PASS |
| Any single venue | ≤2 | 2 | PASS |

North America covers the United States, Canada, and Mexico. Europe covers ten countries and includes northern, southern, eastern, and western Europe. Oceania covers New Zealand and Australia. Asia outside Japan covers six countries/regions. Latin America covers Brazil, Argentina, Chile, and Costa Rica. Middle East/Africa contains Oman, Saudi Arabia, and South Africa, so both major areas appear.

## Evidence gate

- Selected entries meeting the desk-research source threshold: **50/50**.
- Ranked backups meeting the desk-research source threshold: **15/15**.
- Strict `evidence-approved` under the plan's independent-review definition: **0**. No independent blind reviewer signed this execution pass.
- Candidate-only or conflicted entries are not counted as evidence-approved. The selected 50 have no known event/location source conflict, but all still require the independent-review gate.

## Important interpretation

The quota tables audit the **selected research slate**, not release readiness. Production must not begin from a row solely because it is selected. A reviewer must first pin representative start-to-finish timecodes, resolve stable base-map objects, and change `production_clearance` after verifying each Markdown record.
