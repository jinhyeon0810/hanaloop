"use client";

import { useActionState, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import type { ActivityType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABEL,
  UNIT_BY_TYPE,
} from "@/lib/activity-type";
import { formatNumber } from "@/lib/format";
import { DATA_YEAR_MAX, DATA_YEAR_MIN, isInDataYear } from "@/lib/period";
import { cn } from "@/lib/utils";
import {
  createActivities,
  type CreateActivitiesState,
} from "@/app/actions/activity";

export type FactorOption = {
  activityType: ActivityType;
  subCategory: string;
  value: number;
  unit: string;
};

type Row = {
  id: string;
  date: string;
  activityType: ActivityType;
  description: string;
  quantity: string;
};

const INITIAL_STATE: CreateActivitiesState = { status: "idle" };

function defaultDate(): string {
  const today = new Date().toISOString().slice(0, 10);
  return isInDataYear(today) ? today : DATA_YEAR_MAX;
}

function newRow(): Row {
  return {
    id: crypto.randomUUID(),
    date: defaultDate(),
    activityType: "electricity",
    description: "",
    quantity: "",
  };
}

export function ActivityForm({ factors }: { factors: FactorOption[] }) {
  const [state, action, isPending] = useActionState(
    createActivities,
    INITIAL_STATE
  );
  const [rows, setRows] = useState<Row[]>(() => [newRow()]);

  const factorsByType = useMemo(() => {
    const map = new Map<ActivityType, FactorOption[]>();
    for (const f of factors) {
      const arr = map.get(f.activityType) ?? [];
      arr.push(f);
      map.set(f.activityType, arr);
    }
    return map;
  }, [factors]);

  const factorLookup = useMemo(() => {
    const map = new Map<string, FactorOption>();
    for (const f of factors) {
      map.set(`${f.activityType}|${f.subCategory}`, f);
    }
    return map;
  }, [factors]);

  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        if (patch.activityType && patch.activityType !== r.activityType) {
          next.description = "";
        }
        return next;
      })
    );

  const addRow = () => setRows((prev) => [...prev, newRow()]);
  const removeRow = (id: string) =>
    setRows((prev) =>
      prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)
    );

  const previewOf = (row: Row): number | null => {
    const f = factorLookup.get(`${row.activityType}|${row.description}`);
    const q = Number(row.quantity);
    if (!f || !Number.isFinite(q) || q <= 0) return null;
    return q * f.value;
  };

  const totalPreview = rows.reduce((sum, r) => sum + (previewOf(r) ?? 0), 0);
  const validCount = rows.filter((r) => previewOf(r) !== null).length;
  const submitDisabled =
    isPending || validCount === 0 || validCount < rows.length;

  const payload = useMemo(
    () =>
      JSON.stringify(
        rows.map((r) => ({
          date: r.date,
          activityType: r.activityType,
          description: r.description,
          quantity: r.quantity,
        }))
      ),
    [rows]
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="rows" value={payload} />

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-xs">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-[140px]">
                일자
              </th>
              <th className="px-3 py-2 text-left font-medium w-[110px]">
                활동 유형
              </th>
              <th className="px-3 py-2 text-left font-medium">설명 (계수)</th>
              <th className="px-3 py-2 text-right font-medium w-[120px]">량</th>
              <th className="px-3 py-2 text-left font-medium w-[80px]">단위</th>
              <th className="px-3 py-2 text-right font-medium w-[140px]">
                예상 배출량
              </th>
              <th className="w-[40px]"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const opts = factorsByType.get(row.activityType) ?? [];
              const preview = previewOf(row);
              const err =
                state.status === "error" ? state.rowErrors?.[idx] : undefined;

              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-t align-top",
                    err && "bg-destructive/5"
                  )}
                >
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      value={row.date}
                      min={DATA_YEAR_MIN}
                      max={DATA_YEAR_MAX}
                      onChange={(e) =>
                        updateRow(row.id, { date: e.target.value })
                      }
                      className={cellInputClass}
                      aria-invalid={!!err?.date}
                    />
                    {err?.date && <FieldError msg={err.date} />}
                  </td>
                  <td className="px-2 py-2">
                    <Select
                      value={row.activityType}
                      onValueChange={(value) =>
                        updateRow(row.id, {
                          activityType: value as ActivityType,
                        })
                      }
                    >
                      <SelectTrigger
                        className={cellSelectTriggerClass}
                        aria-invalid={!!err?.activityType}
                        aria-label="활동 유형"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {ACTIVITY_TYPE_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {err?.activityType && <FieldError msg={err.activityType} />}
                  </td>
                  <td className="px-2 py-2">
                    <Select
                      key={`${row.id}-${row.activityType}`}
                      value={row.description || undefined}
                      onValueChange={(value) =>
                        updateRow(row.id, { description: value })
                      }
                    >
                      <SelectTrigger
                        className={cellSelectTriggerClass}
                        aria-invalid={!!err?.description}
                        aria-label="설명"
                      >
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {opts.map((opt) => (
                          <SelectItem
                            key={opt.subCategory}
                            value={opt.subCategory}
                          >
                            {opt.subCategory} ({opt.value} {opt.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {err?.description && <FieldError msg={err.description} />}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      placeholder="0"
                      value={row.quantity}
                      onChange={(e) =>
                        updateRow(row.id, { quantity: e.target.value })
                      }
                      className={cn(cellInputClass, "text-right tabular-nums")}
                      aria-invalid={!!err?.quantity}
                    />
                    {err?.quantity && <FieldError msg={err.quantity} />}
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">
                    {UNIT_BY_TYPE[row.activityType]}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {preview === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span>
                        {formatNumber(preview)}{" "}
                        <span className="text-muted-foreground text-xs">
                          kgCO2e
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      aria-label="행 삭제"
                      className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t bg-muted/30 text-xs">
            <tr>
              <td colSpan={5} className="px-3 py-2 font-medium">
                총 {validCount}건 유효 / {rows.length}행
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {totalPreview > 0 ? (
                  <>
                    {formatNumber(totalPreview)}{" "}
                    <span className="text-muted-foreground">kgCO2e</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {state.formError ? (
        <p role="alert" className="text-sm text-destructive">
          {state.formError}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={isPending}
        >
          + 행 추가
        </Button>
        {/* <Button type="submit" disabled={submitDisabled}> */}
        <Button type="submit" disabled={false}>
          {isPending ? "저장 중…" : `저장 (${validCount}건)`}
        </Button>
      </div>

      {validCount < rows.length && (
        <p className="text-xs text-muted-foreground">
          모든 행을 채워야 저장할 수 있습니다. 비어있는 행은 삭제하세요.
        </p>
      )}
    </form>
  );
}

const cellInputClass =
  "h-8 w-full rounded border border-input bg-background px-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const cellSelectTriggerClass = "h-8 rounded px-2 text-sm";

function FieldError({ msg }: { msg: string }) {
  return (
    <p role="alert" className="mt-1 text-[11px] text-destructive">
      {msg}
    </p>
  );
}
