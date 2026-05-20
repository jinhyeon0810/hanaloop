"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, FileSpreadsheet, RotateCcw, Upload, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { importActivities, type ImportState } from "@/app/actions/import";
import { cn } from "@/lib/utils";

const INITIAL_STATE: ImportState = { status: "idle" };
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT_EXTS = [".xlsx", ".csv"] as const;

export function ImportForm() {
  const [state, action, isPending] = useActionState(importActivities, INITIAL_STATE);
  const [, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = (next: File | null) => {
    setClientError(null);
    if (!next) {
      setFile(null);
      return;
    }
    const lower = next.name.toLowerCase();
    const okExt = ACCEPT_EXTS.some((ext) => lower.endsWith(ext));
    if (!okExt) {
      setClientError(".xlsx 또는 .csv 파일만 업로드할 수 있습니다.");
      setFile(null);
      return;
    }
    if (next.size > MAX_BYTES) {
      setClientError("파일 크기는 10MB 이하여야 합니다.");
      setFile(null);
      return;
    }
    setFile(next);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    startTransition(() => action(fd));
  };

  const reset = () => {
    setFile(null);
    setClientError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  useEffect(() => {
    if (state.status === "fileError") {
      setClientError(state.message);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [state]);

  const showResult =
    state.status === "ok" ||
    state.status === "partial" ||
    state.status === "all_rejected" ||
    state.status === "empty";

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between md:gap-3">
            <CardTitle className="text-base">파일 업로드</CardTitle>
            {clientError && (
              <p
                role="alert"
                className="flex items-start gap-1 text-xs text-destructive md:text-right"
              >
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{clientError}</span>
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv"
                className="sr-only"
                onChange={(e) => validateAndSet(e.target.files?.[0] ?? null)}
                disabled={isPending}
              />

              {!file ? (
                <Dropzone
                  isDragOver={isDragOver}
                  disabled={isPending}
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    validateAndSet(e.dataTransfer.files?.[0] ?? null);
                  }}
                />
              ) : (
                <FilePill file={file} onRemove={reset} disabled={isPending} />
              )}

              <p className="text-[11px] text-muted-foreground">
                .xlsx · .csv · 10MB 이하
              </p>

              <Button
                type="submit"
                size="sm"
                disabled={!file || isPending}
                className="w-full"
              >
                <Upload className="h-4 w-4" />
                {isPending ? "처리 중…" : "업로드"}
              </Button>
            </form>
          </CardContent>
        </Card>

      {showResult && (
        <Card>
          <CardContent className="p-4 md:p-6">

            {(state.status === "ok" ||
              state.status === "partial" ||
              state.status === "all_rejected" ||
              state.status === "empty") && (
              <ImportResultView state={state} onReset={reset} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Dropzone({
  isDragOver,
  disabled,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  isDragOver: boolean;
  disabled: boolean;
  onClick: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      disabled={disabled}
      className={cn(
        "group flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/60 hover:bg-muted/40",
      )}
    >
      <UploadCloud
        className={cn(
          "h-8 w-8 transition-colors",
          isDragOver ? "text-primary" : "text-muted-foreground group-hover:text-primary/80",
        )}
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">파일을 끌어다 놓거나 클릭</span>
        <span className="text-[11px] text-muted-foreground">첫 행은 헤더여야 합니다</span>
      </div>
    </button>
  );
}

function FilePill({
  file,
  onRemove,
  disabled,
}: {
  file: File;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
      <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium" title={file.name}>
          {file.name}
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {formatBytes(file.size)}
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="파일 선택 해제"
        className={cn(
          "rounded p-1 text-muted-foreground transition-colors",
          "hover:bg-destructive/10 hover:text-destructive",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ImportResultView({
  state,
  onReset,
}: {
  state: Extract<ImportState, { fileName: string }>;
  onReset: () => void;
}) {
  const { fileName, accepted, rejected } = state;
  const total = accepted.length + rejected.length;
  const noneAccepted = accepted.length === 0;
  const emptyFile = total === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <strong className="text-foreground">{fileName}</strong> · 총 {total}행 처리됨
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="h-3.5 w-3.5" />
          다시 업로드
        </Button>
      </div>

      {emptyFile && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">처리할 데이터가 없습니다.</span>
            <span className="text-xs">파일에 헤더만 있고 데이터 행이 없습니다. 위 양식을 확인해주세요.</span>
          </div>
        </div>
      )}

      {!emptyFile && noneAccepted && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">저장된 활동이 없습니다.</span>
            <span className="text-xs">
              모든 행({rejected.length}건)이 양식에 맞지 않습니다. 위 양식을 확인해주세요.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <CountTile color="emerald" label="저장됨" count={accepted.length} />
        <CountTile color="destructive" label="거부됨" count={rejected.length} />
      </div>

      {accepted.length > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {accepted.length}건이 활동 목록에 추가되었습니다.
          </span>
          <Link href="/activities" className="font-medium text-primary hover:underline">
            활동 목록 보기 →
          </Link>
        </div>
      )}

      {rejected.length > 0 && <RejectedTable rejected={rejected} fileName={fileName} />}
    </div>
  );
}

function CountTile({
  color,
  label,
  count,
}: {
  color: "emerald" | "amber" | "destructive";
  label: string;
  count: number;
}) {
  const tone =
    color === "emerald"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : color === "amber"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "border-destructive/30 bg-destructive/10 text-destructive";
  return (
    <div className={cn("flex items-baseline justify-between rounded-md border px-3 py-2", tone)}>
      <span className="text-xs font-medium">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{count}</span>
    </div>
  );
}

function RejectedTable({
  rejected,
  fileName,
}: {
  rejected: Extract<ImportState, { fileName: string }>["rejected"];
  fileName: string;
}) {
  const downloadCsv = () => {
    const headers = ["행 번호", "일자", "활동 유형", "설명", "량", "단위", "에러 사유"];
    const rows = rejected.map((r) => [
      String(r.rowNumber),
      r.raw.date instanceof Date ? r.raw.date.toISOString().slice(0, 10) : String(r.raw.date ?? ""),
      r.raw.activityType,
      r.raw.description,
      String(r.raw.quantity),
      r.raw.unit,
      r.reason,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(/\.[^.]+$/, "")}_rejected.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">거부된 행 ({rejected.length})</h3>
        <Button type="button" variant="outline" size="sm" onClick={downloadCsv}>
          거부 행 CSV 다운로드
        </Button>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[680px] text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">행</th>
              <th className="px-3 py-2 text-left font-medium">일자</th>
              <th className="px-3 py-2 text-left font-medium">활동 유형</th>
              <th className="px-3 py-2 text-left font-medium">설명</th>
              <th className="px-3 py-2 text-right font-medium">량</th>
              <th className="px-3 py-2 text-left font-medium">단위</th>
              <th className="px-3 py-2 text-left font-medium">사유</th>
            </tr>
          </thead>
          <tbody>
            {rejected.map((r) => (
              <tr key={r.rowNumber} className="border-t">
                <td className="px-3 py-2 tabular-nums">{r.rowNumber}</td>
                <td className="px-3 py-2">
                  {r.raw.date instanceof Date
                    ? r.raw.date.toISOString().slice(0, 10)
                    : String(r.raw.date ?? "")}
                </td>
                <td className="px-3 py-2">{r.raw.activityType}</td>
                <td className="px-3 py-2">{r.raw.description}</td>
                <td className="px-3 py-2 text-right tabular-nums">{String(r.raw.quantity)}</td>
                <td className="px-3 py-2">{r.raw.unit}</td>
                <td className="px-3 py-2 text-destructive">{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
