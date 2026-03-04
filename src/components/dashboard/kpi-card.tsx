"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend: "up" | "down" | "neutral";
}

export function KpiCard({ label, value, change, icon: Icon, trend }: KpiCardProps) {
  return (
    <div className="glass rounded-xl p-6 group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-heading font-bold tracking-tight">{value}</p>
      <div className="flex items-center gap-1 mt-1">
        {trend !== "neutral" && (
          trend === "up" ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )
        )}
        <span
          className={cn(
            "text-xs",
            trend === "up" && "text-emerald-500",
            trend === "down" && "text-red-500",
            trend === "neutral" && "text-muted-foreground"
          )}
        >
          {change}
        </span>
      </div>
    </div>
  );
}
