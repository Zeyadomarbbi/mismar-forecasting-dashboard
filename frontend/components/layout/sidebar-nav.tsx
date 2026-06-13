"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  LayoutDashboard,
  MapPinned,
  Sigma,
} from "lucide-react";
import clsx from "clsx";
import { NAV_ITEMS } from "@/lib/constants";

const iconMap = {
  "/": LayoutDashboard,
  "/city-forecasts": MapPinned,
  "/all-cities": Building2,
  "/actual-vs-predicted": Activity,
  "/methodology": Sigma,
};

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {NAV_ITEMS.map((item) => {
        const Icon = iconMap[item.href as keyof typeof iconMap];
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
              active
                ? "border-teal bg-teal/10 text-navy"
                : "border-transparent bg-white text-muted hover:border-border hover:text-navy"
            )}
          >
            <span>{item.label}</span>
            <Icon className="h-4 w-4 shrink-0" />
          </Link>
        );
      })}
    </nav>
  );
}
