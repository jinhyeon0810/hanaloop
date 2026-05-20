import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6" aria-busy>
      <header className="flex flex-col gap-2">
        <div className="h-7 w-48 rounded bg-muted" />
        <div className="h-4 w-80 rounded bg-muted/70" />
      </header>
      <Card>
        <CardHeader>
          <div className="h-5 w-32 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-10 w-full rounded bg-muted/70" />
          <div className="h-9 w-24 rounded bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
