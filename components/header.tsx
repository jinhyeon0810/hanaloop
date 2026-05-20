import { Leaf } from "lucide-react";

import { MobileNav } from "@/components/mobile-nav";
import { PersonaToggle } from "@/components/persona-toggle";
import { readPersona } from "@/lib/persona";

export async function Header() {
  const persona = await readPersona();
  return (
    <header className="flex h-14 items-center justify-between gap-2 border-b bg-background px-3 md:gap-3 md:px-6">
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        <MobileNav />
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <Leaf
            aria-hidden
            className="h-4 w-4 shrink-0 text-primary md:hidden"
          />
          <span className="truncate font-semibold text-foreground md:font-normal md:text-muted-foreground">
            Hanaloop
          </span>
          <span aria-hidden className="hidden md:inline">
            ·
          </span>
          <span className="hidden truncate text-foreground md:inline">
            PCF 전과정 대시보드
          </span>
        </div>
      </div>
      <div className="shrink-0">
        <PersonaToggle current={persona} />
      </div>
    </header>
  );
}
