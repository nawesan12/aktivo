"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  change: string;
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
 *
 * The icon tile that used to sit in the corner is gone — four jade squares
 * competed with the figures they were labelling, which are the only thing on
 * this row anyone reads.
 */
export function KpiCard({ label, value, change, trend, href }: KpiCardProps) {
  const card = (
    <Card padding="none" className="group h-full p-[18px]">
      <span className="mb-2 flex items-center gap-1 text-[11px] text-muted-foreground">
        {label}
        {href && (
          <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
        )}
      </span>
      <p className="text-[28px] font-extrabold leading-none tracking-[-0.03em]">{value}</p>
      <span
        className={cn(
          "mt-1.5 text-[11px]",
          trend === "up" && "text-jade-label",
          trend === "down" && "text-danger-foreground",
          trend === "neutral" && "text-muted-foreground"
        )}
      >
        {trend === "up" ? "▲ " : trend === "down" ? "▼ " : ""}
        {change}
      </span>
    </Card>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {card}
    </Link>
  );
}
