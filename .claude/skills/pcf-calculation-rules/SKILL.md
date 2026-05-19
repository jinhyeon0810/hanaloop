---
name: pcf-calculation-rules
description: PCF calculation rules for the CT-045 monitor — formula, factor matching, aggregation, and error handling. Use when computing or reviewing kgCO2e values, matching activities to factors, or rendering totals.
---

# PCF Calculation Rules (CT-045)

Dataset: monthly activities across 2025 (Jan–Aug), three activity types (전기/원소재/운송), four seeded factors with no regional or temporal variance.

## 1. Formula

```
emissions_kgco2e = quantity × factor_value
```

| Activity type   | Quantity unit | Factor unit           |
|-----------------|---------------|-----------------------|
| `electricity`   | kWh           | kgCO2e per kWh        |
| `raw_material`  | kg            | kgCO2e per kg         |
| `transport`     | ton-km        | kgCO2e per ton-km     |

Inputs always arrive in the factor's base unit (no MWh, g, ton, kg-km in the dataset). **No unit conversion implemented.** A future input row carrying a non-base unit returns `ERR_UNIT_MISMATCH`, never auto-converted.

## 2. Factor matching

Given an activity `(type, description)`:

1. Find factor where `factor.activity_type == activity.type` AND `factor.sub_category == activity.description` (exact string match — no normalization).
2. Exactly one match → use it.
3. Zero matches → return `ERR_FACTOR_NOT_FOUND` with the search key.

No region or date filtering — all seeded factors are valid throughout the dataset. `"플라스틱1"` and `"플라스틱 1"` are different strings (whitespace matters); typos in description fail the lookup.

**Seeded factors:**

| activity_type   | sub_category | value | unit              | source              |
|-----------------|--------------|-------|-------------------|---------------------|
| `electricity`   | 한국전력     | 0.456 | kgCO2e/kWh        | Hanaloop 과제 제공  |
| `raw_material`  | 플라스틱 1   | 2.3   | kgCO2e/kg         | Hanaloop 과제 제공  |
| `raw_material`  | 플라스틱 2   | 3.2   | kgCO2e/kg         | Hanaloop 과제 제공  |
| `transport`     | 트럭         | 3.5   | kgCO2e/ton-km     | Hanaloop 과제 제공  |

## 3. Factor schema (versioning-ready)

No supersession workflow (factors are immutable seed data), but the schema supports future versioning:

- `valid_from` (date) — default `2025-01-01` for seed
- `valid_to` (date, nullable) — `NULL` = currently effective
- `source` (string, NOT NULL) — every factor cites its origin

Schema is ready, no UI to mutate factors.

## 4. Aggregation

- **Total**: sum `emissions_kgco2e` across all activities in the selected period.
- **By activity type**: group by `activity_type` — used by the dashboard chart.
- **Display unit**:
  - Total ≥ 1000 kgCO2e → `t CO2e` with 2 decimals
  - Total < 1000 kgCO2e → `kgCO2e` with 1 decimal
- **Period selection**: 2025 Q1 / Q2 / Q3 / YTD (2025-01-01 to most recent activity).

## 5. Errors

| Code                     | Trigger                                                                   |
|--------------------------|---------------------------------------------------------------------------|
| `ERR_FACTOR_NOT_FOUND`   | Activity `description` doesn't match any factor's `sub_category` exactly  |
| `ERR_QUANTITY_INVALID`   | `quantity` ≤ 0 or NaN                                                     |
| `ERR_UNIT_MISMATCH`      | Unit not the factor's base unit (e.g., MWh for electricity instead of kWh)|

Always return structured errors — never substitute a default value.

## 6. Audit trail

Every aggregated number on the dashboard must trace to `(activity row × factor row)`. The factor's `source` carries through to any explanation UI so that "이 숫자는 어디서 나왔나요?" is answerable.
