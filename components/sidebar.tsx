import { Leaf } from "lucide-react";

import { SidebarNav } from "@/components/sidebar-nav";

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <Leaf className="h-5 w-5 text-primary" />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Hanaloop PCF</span>
          <span className="text-[11px] text-muted-foreground">CT-045</span>
        </div>
      </div>
      <SidebarNav />
    </aside>
  );
}
