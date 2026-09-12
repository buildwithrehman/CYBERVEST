"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { NAVIGATION_CONFIG } from "./NavigationConfig";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden xl:flex w-[240px] flex-col bg-forest text-white h-screen border-r border-forest-800 flex-shrink-0">
      <div className="h-16 flex items-center px-6 font-bold text-lg tracking-tight">
        CYBERVEST
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {NAVIGATION_CONFIG.map((group) => (
          <div key={group.group}>
            <h3 className="px-3 text-xs font-semibold text-mint/60 uppercase tracking-wider mb-2">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-forest-800 text-white font-medium"
                        : "text-mint/80 hover:text-white hover:bg-forest-800/50"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
