"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NAVIGATION_CONFIG } from "./NavigationConfig";

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="xl:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 -ml-2 text-slate-600 hover:text-slate-900 focus:outline-none"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-forest text-white">
            <div className="flex h-16 items-center justify-between px-6">
              <span className="font-bold text-lg tracking-tight">CYBERVEST</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-mint hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
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
                          onClick={() => setIsOpen(false)}
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
          </div>
        </div>
      )}
    </div>
  );
}
