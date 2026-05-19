---
name: dashboard-design-patterns
description: Project-specific dashboard rules for the Hanaloop PCF Dashboard — persona definitions, screen-to-persona mapping, and required state coverage. Use before building or restructuring any dashboard screen. Pair with `aesthetic` and `frontend-design` skills for general visual quality.
---

# Dashboard Design Patterns (Hanaloop PCF)

Only project-specific rules. General UI/UX heuristics live in the `aesthetic` and `frontend-design` skills — invoke those for visual hierarchy, typography, color theory.

## 1. Personas (project-specific)

Two personas. Every screen targets exactly one.

| Persona     | Primary task                                | Density profile                                                   |
|-------------|---------------------------------------------|-------------------------------------------------------------------|
| `operator`  | Activity data entry, audit, drill-down      | High: tables, filters, full row detail, edit affordances          |
| `executive` | At-a-glance carbon status and trend         | Low: 3–6 KPI tiles max, one hero chart, no tables, no filters     |

Mixed-density screens are usually a sign the persona wasn't decided. Pick one.

## 2. Screen → persona map

| Screen                          | Persona     | Primary task                                   |
|---------------------------------|-------------|------------------------------------------------|
| `/` (overview)                  | executive   | Current period kgCO2e + trend                  |
| `/activities`                   | operator    | List, filter, edit activity rows               |
| `/activities/import`            | operator    | Upload Excel, review accepted/rejected rows    |
| `/factors`                      | operator    | Browse/review emission factors and versions    |
| `/reports`                      | executive   | Period-over-period totals by scope             |

Update this table when adding screens. If a new screen doesn't fit either persona, the persona model is the problem — don't invent a third.

## 3. Unit display (load-bearing — defers to `pcf-calculation-rules`)

- ≥ 1000 kgCO2e → `t CO2e`, 2 decimals
- < 1000 kgCO2e → `kgCO2e`, 1 decimal
- Every numeric value carries a unit. Bare numbers are a design bug.

## 4. Required states (every data view)

Design these explicitly before declaring a screen done.

| State    | Trigger                                  | Required UI                                                    |
|----------|------------------------------------------|----------------------------------------------------------------|
| Empty    | Zero rows returned                       | Illustration/icon + one-line Korean explanation + next-action CTA |
| Loading  | Initial fetch or refetch in flight       | Skeleton matching final layout (not a spinner)                 |
| Partial  | Some rows loaded, some failed            | Show loaded data + inline warning identifying the gap          |
| Error    | Fetch failed                             | Plain-language Korean message + retry button                   |

Operator screens additionally need: row-level error state (when a single activity fails domain validation post-load).

## 5. Screen proposal checklist (before implementing)

1. Target persona — operator or executive?
2. Primary task — what is the user doing in 10 seconds?
3. Top 3 things on screen — visual hierarchy
4. What's intentionally absent — what you chose to leave out and why
5. State coverage — empty, loading, partial, error all specified?

If you can't answer all five, don't start the implementation.
