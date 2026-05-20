"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDbError =
    error.message.includes("DATABASE_URL") ||
    error.message.includes("PrismaClientInitializationError") ||
    error.message.includes("Can't reach database");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-12">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold">
              {isDbError
                ? "데이터베이스에 연결할 수 없습니다"
                : "문제가 발생했습니다"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isDbError
                ? "Postgres 컨테이너가 실행 중인지, .env의 DATABASE_URL이 설정됐는지 확인해주세요."
                : "예기치 못한 오류가 발생했어요. 다시 시도해 보세요."}
            </p>
          </div>

          {isDbError && (
            <div className="rounded-md border bg-muted/40 p-3 text-xs">
              <p className="mb-2 font-medium">로컬 셋업 체크리스트</p>
              <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
                <li>
                  <code className="rounded bg-background px-1 py-0.5">
                    cp .env.example .env
                  </code>
                </li>
                <li>
                  <code className="rounded bg-background px-1 py-0.5">
                    yarn db:up
                  </code>
                </li>
                <li>
                  <code className="rounded bg-background px-1 py-0.5">
                    yarn prisma migrate deploy && yarn prisma db seed
                  </code>
                </li>
              </ol>
            </div>
          )}

          {error.digest && (
            <p className="text-[11px] text-muted-foreground">
              error id: <code>{error.digest}</code>
            </p>
          )}

          <div className="flex gap-2">
            <Button type="button" onClick={reset}>
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
