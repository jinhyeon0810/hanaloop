import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type KpiTileProps = {
  label: string;
  value: { value: string; unit: string };
  href: string | null;
  emphasizeTon?: boolean;
  forceUnit?: "t CO2e";
};

export function KpiTile({
  label,
  value,
  href,
  emphasizeTon,
  forceUnit,
}: KpiTileProps) {
  const display = forceUnit ? { value: value.value, unit: forceUnit } : value;
  const body = (
    <Card
      className={cn("h-full", href && "transition-colors hover:bg-muted/40")}
    >
      <CardContent className="flex flex-col gap-2 p-4 md:p-5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "text-xl font-semibold tabular-nums tracking-tight sm:text-2xl",
              emphasizeTon && "sm:text-3xl",
            )}
          >
            {display.value}
          </span>
          {display.unit ? (
            <span className="text-xs text-muted-foreground">
              {display.unit}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} aria-label={`${label} 상세 보기`}>
        {body}
      </Link>
    );
  }
  return body;
}
