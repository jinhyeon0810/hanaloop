"use client";

import { useTransition } from "react";

import { setPersona } from "@/app/actions/persona";
import { cn } from "@/lib/utils";
import type { Persona } from "@/lib/persona";

const OPTIONS: { value: Persona; label: string }[] = [
  { value: "executive", label: "경영자" },
  { value: "operator", label: "실무자" },
];

export function PersonaToggle({ current }: { current: Persona }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label="페르소나 전환"
      className="inline-flex items-center rounded-md border border-input bg-background p-0.5 shadow-sm"
    >
      {OPTIONS.map((option) => {
        const active = option.value === current;
        return (
          <button
            key={option.value}
            type="button"
            disabled={isPending}
            aria-pressed={active}
            onClick={() =>
              startTransition(async () => {
                await setPersona(option.value);
              })
            }
            className={cn(
              "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 sm:px-3",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
