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

| activity_type   | sub_category | value | unit              | source                          |
|-----------------|--------------|-------|-------------------|----------------------------------|
| `electricity`   | 한국전력     | 0.456 | kgCO2e/kWh        | 한국전력 전력배출계수            |
| `raw_material`  | 플라스틱 1   | 2.3   | kgCO2e/kg         | 플라스틱 1 배출계수              |
| `raw_material`  | 플라스틱 2   | 3.2   | kgCO2e/kg         | 플라스틱 2 배출계수              |
| `transport`     | 트럭         | 3.5   | kgCO2e/ton-km     | 중대형 트럭 화물수송 배출계수    |

## 3. Factor schema (append-only versioning)

Schema is versioning-capable but the seed uses 1 row per `(activityType, subCategory)`:

- `valid_from` (date, NOT NULL) — 적용 시작일. 기본 `2025-01-01`
- `source` (string, NOT NULL) — every factor cites its origin

**No `valid_to` column.** 종료일은 같은 `(activityType, subCategory)`의 다음 행의 `valid_from`이 암묵적으로 정의함 (append-only chronological log). 특정 시점의 유효 계수는 `valid_from <= asOf` 중 가장 큰 1건.

이번 과제 시드는 1버전만 사용하므로 매칭 알고리즘에서 날짜 필터를 생략해도 결과 동일하나, 운영 시에는 `valid_from` 기준 정렬 + LIMIT 1로 결정한다.

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
