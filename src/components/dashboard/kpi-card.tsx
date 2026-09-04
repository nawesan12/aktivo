"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowRight, type LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend: "up" | "down" | "neutral";
  /** Where the number leads. Without it the card is a figure and a dead end. */
  href?: string;
}

/**
 * A number you can act on.
 *
 * The dashboard was four of these, two charts and two lists, with not a single
 * link on the whole screen: the owner opened the panel, read "Turnos hoy: 4",
 * and had to go find the sidebar to do anything about it.
 */
export function KpiCard({ label, value, change, icon: Icon, trend, href }: KpiCardProps) {
  const card = (
    <div
      className={cn(
        "glass rounded-xl p-6 group h-full",
        href && "transition-colors hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-primary"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          {label}
          {href && (
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
          )}
        </span>
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-heading font-bold tracking-tight">{value}</p>
      <div className="flex items-center gap-1 mt-1">
        {trend !== "neutral" && (
          trend === "up" ? (
            <TrendingUp className="w-3 h-3 text-success-foreground" />
          ) : (
            <TrendingDown className="w-3 h-3 text-danger-foreground" />
          )
        )}
        <span
          className={cn(
            "text-xs",
            trend === "up" && "text-success-foreground",
            trend === "down" && "text-danger-foreground",
            trend === "neutral" && "text-muted-foreground"
          )}
        >
          {change}
        </span>
      </div>
    </div>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block rounded-xl focus:outline-none">
      {card}
    </Link>
  );
}
