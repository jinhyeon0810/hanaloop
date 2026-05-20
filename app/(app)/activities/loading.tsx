import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" aria-busy>
      <header className="flex flex-col gap-2">
        <div className="h-7 w-32 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted/70" />
      </header>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-6 w-16 rounded-md bg-muted" />
        ))}
      </div>
      <Card>
        <CardContent className="space-y-2 p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-full rounded bg-muted/70" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
