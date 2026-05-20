"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Gauge, Sigma } from "lucide-react";

import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof Gauge;
};

export const NAV: NavItem[] = [
  { href: "/", label: "대시보드", icon: Gauge },
  { href: "/activities", label: "활동 목록", icon: Activity },
  { href: "/factors", label: "배출계수", icon: Sigma },
];

export function isActive(activePath: string, href: string) {
  if (href === "/") return activePath === "/";
  return activePath === href || activePath.startsWith(`${href}/`);
}

export function SidebarNav({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const activePath = usePathname() ?? "/";

  return (
    <nav className={cn("flex flex-1 flex-col gap-0.5 p-3", className)}>
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(activePath, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
