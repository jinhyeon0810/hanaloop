import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportForm } from "./import-form";

export const metadata = { title: "파일로 한 번에 추가 · Hanaloop PCF" };

export default function ImportPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/activities"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        활동 목록으로
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">파일로 한 번에 추가</h1>
        <p className="text-xs text-muted-foreground md:text-sm">
          엑셀 또는 CSV 파일을 업로드하면 여러 활동을 한 번에 등록합니다. 이미 등록된 행과 동일한 데이터는 다시 저장되지 않습니다.
        </p>
      </header>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base">양식 안내</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-4 pt-0 text-sm md:p-6 md:pt-0">
          <p className="text-muted-foreground">
            첫 행에 다음 5개 헤더가 모두 있어야 합니다 (순서 무관):
          </p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[420px] text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">일자</th>
                  <th className="px-3 py-2 text-left font-medium">활동 유형</th>
                  <th className="px-3 py-2 text-left font-medium">설명</th>
                  <th className="px-3 py-2 text-right font-medium">량</th>
                  <th className="px-3 py-2 text-left font-medium">단위</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 tabular-nums">2025-01-05</td>
                  <td className="px-3 py-2">전기</td>
                  <td className="px-3 py-2">한국전력</td>
                  <td className="px-3 py-2 text-right tabular-nums">12000</td>
                  <td className="px-3 py-2">kWh</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 tabular-nums">2025-01-10</td>
                  <td className="px-3 py-2">원소재</td>
                  <td className="px-3 py-2">플라스틱 1</td>
                  <td className="px-3 py-2 text-right tabular-nums">800</td>
                  <td className="px-3 py-2">kg</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 tabular-nums">2025-01-20</td>
                  <td className="px-3 py-2">운송</td>
                  <td className="px-3 py-2">트럭</td>
                  <td className="px-3 py-2 text-right tabular-nums">450</td>
                  <td className="px-3 py-2">ton-km</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            <li>활동 유형: 전기 / 원소재 / 운송 중 하나</li>
            <li>단위: 전기=kWh · 원소재=kg · 운송=ton-km (활동 유형과 일치해야 함)</li>
            <li>
              설명: <Link href="/factors" className="underline">등록된 계수</Link>의 세부 항목과 정확히 일치해야 함
            </li>
            <li>량: 0보다 큰 숫자만 허용</li>
          </ul>
        </CardContent>
      </Card>

      <ImportForm />
    </div>
  );
}
