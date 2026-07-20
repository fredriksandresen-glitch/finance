"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, CircleDollarSign, Home, Landmark, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/investeringer", label: "Investeringer", icon: Landmark },
  { href: "/inntekter-utgifter", label: "Inntekter og utgifter", icon: CircleDollarSign },
  { href: "/nettoformue", label: "Nettoformue", icon: BarChart3 },
  { href: "/innstillinger", label: "Innstillinger", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-black/10 bg-white/90 p-5 backdrop-blur dark:border-white/10 dark:bg-zinc-950/90 lg:block">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
            <Building2 size={20} />
          </div>
          <div>
            <p className="font-semibold">Finansoversikt</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Personlig MVP</p>
          </div>
        </div>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white",
                  active && "bg-zinc-950 text-white hover:bg-zinc-950 hover:text-white dark:bg-white dark:text-zinc-950",
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-black/10 bg-white/85 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-zinc-950/85 lg:hidden">
          <p className="font-semibold">Finansoversikt</p>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    "flex h-10 min-w-10 items-center justify-center rounded-md border border-black/10 bg-white text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300",
                    pathname === item.href && "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950",
                  )}
                >
                  <Icon size={18} />
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
