---
name: pcf-calculation-rules
description: Canonical rules for product carbon footprint calculations in the Hanaloop dashboard — emission factor selection, unit conversion, activity-to-emission math, and edge cases. Use when computing or reviewing kgCO2e values, matching activities to factors, or converting between units.
---

# PCF Calculation Rules

Canonical math and matching rules for the Hanaloop PCF Dashboard. All emission outputs are in **kgCO2e** unless explicitly stated.

## 1. Activity → Emission formula

```
emissions_kgco2e = activity_quantity_in_factor_base_unit × factor_value
```

Concretely per activity type:

| Activity type | Input unit | Factor unit                | Math                                    |
|---------------|------------|----------------------------|-----------------------------------------|
| electricity   | kWh        | kgCO2e per kWh             | `kWh × factor`                          |
| raw_material  | kg         | kgCO2e per kg              | `kg × factor`                           |
| transport     | ton-km     | kgCO2e per ton-km          | `(mass_ton × distance_km) × factor`     |

## 2. Unit conversion table (input → factor base unit)

| From         | To       | Conversion       |
|--------------|----------|------------------|
| MWh          | kWh      | × 1000           |
| Wh           | kWh      | × 0.001          |
| g            | kg       | × 0.001          |
| ton (metric) | kg       | × 1000           |
| ton-km       | ton-km   | identity         |
| kg-km        | ton-km   | × 0.001          |

Rules:
- Conversion happens **before** factor multiplication.
- Imperial units (lb, mile) are **not** supported — reject at validation with `ERR_UNIT_UNSUPPORTED`.
- Mixed units in a single row are **not** auto-coerced — reject with `ERR_UNIT_MISMATCH`.

## 3. Factor selection algorithm

Given an activity row `(type, region, year, sub_category, unit)`:

1. Filter factors by `activity_type == type`.
2. Filter by `region` exact match, else `region == 'GLOBAL'` fallback.
3. Filter by `valid_from ≤ activity_date ≤ valid_to` (or `valid_to IS NULL` for current).
4. Filter by `sub_category` exact match if specified, else factors with `sub_category IS NULL`.
5. If exactly one factor remains → use it.
6. If zero factors remain → return `ERR_FACTOR_NOT_FOUND` with the search key.
7. If multiple factors remain → return `ERR_FACTOR_AMBIGUOUS`. Never auto-pick.

## 4. Factor versioning

- Factors are **immutable** once referenced by any activity.
- Updating a factor value = inserting a new factor row with `valid_from = today` and setting the previous row's `valid_to = today - 1`.
- Existing activities continue to reference the prior factor version (by `factor_id`), not by lookup. Historical totals don't drift.

## 5. Aggregation rules

- **Per-product total**: sum kgCO2e across all activities for that product, within the selected period.
- **By scope**: group activities by `scope` field (`raw_material`, `processing`, `transport`).
- **Executive display**: if total ≥ 1000 kgCO2e, display as `t CO2e` (= kg / 1000) with 2 decimals. Otherwise kgCO2e with 1 decimal.
- **Comparisons**: period-over-period uses absolute kgCO2e delta and percentage. Show both.

## 6. Edge cases (always return structured error, never silent defaults)

| Situation                                      | Error code              |
|------------------------------------------------|-------------------------|
| Activity unit not in conversion table          | `ERR_UNIT_UNSUPPORTED`  |
| Activity unit incompatible with factor unit    | `ERR_UNIT_MISMATCH`     |
| No factor matches the search key               | `ERR_FACTOR_NOT_FOUND`  |
| Multiple factors match (ambiguous)             | `ERR_FACTOR_AMBIGUOUS`  |
| Negative or zero activity quantity             | `ERR_QUANTITY_INVALID`  |
| Activity date outside any factor's validity    | `ERR_FACTOR_EXPIRED`    |

## 7. Sources

Every factor row must record `source` (e.g., `Ecoinvent 3.10`, `IPCC AR6 GWP100`, `K-LCI 2023`). Calculations carry this source through to the report so an auditor can trace any kgCO2e back to a citable factor.
