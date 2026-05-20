import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({ periodLabel }: { periodLabel: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="rounded-full bg-muted p-4">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-6 w-6 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 10h18" />
            <path d="M9 4v4" />
            <path d="M15 4v4" />
          </svg>
        </div>
        <p className="text-base font-semibold">
          {periodLabel}에 등록된 활동이 없습니다
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          다른 기간을 선택하거나, 활동을 추가해 PCF를 산정해 보세요.
        </p>
      </CardContent>
    </Card>
  );
}
