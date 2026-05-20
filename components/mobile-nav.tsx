"use client";

import { useState } from "react";
import { Leaf, Menu } from "lucide-react";

import { SidebarNav } from "@/components/sidebar-nav";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="메뉴 열기"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:hidden"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[260px] flex-col gap-0 bg-sidebar p-0 text-sidebar-foreground sm:max-w-[260px]"
      >
        <div className="flex h-14 items-center gap-2 border-b px-5">
          <Leaf className="h-5 w-5 text-primary" />
          <div className="flex flex-col leading-tight">
            <SheetTitle className="text-sm font-semibold leading-tight">
              Hanaloop PCF
            </SheetTitle>
            <SheetDescription className="text-[11px] leading-tight">
              CT-045
            </SheetDescription>
          </div>
        </div>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
