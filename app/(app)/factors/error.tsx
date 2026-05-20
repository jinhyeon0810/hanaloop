"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function FactorsError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm font-medium">계수 목록을 불러오지 못했습니다</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            DB가 실행 중인지 확인하고 다시 시도해주세요. (`yarn db:up`)
          </p>
          <Button variant="outline" size="sm" onClick={reset}>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
