import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholders sized in fractions, not pixels.
 *
 * These were built with fixed widths — a filter bar of `w-64 + w-32 + w-32` is
 * 540px of content that cannot shrink, inside a card that is 343px wide on a
 * phone. The card clips with `overflow-hidden`, so the page never scrolled
 * sideways and an overflow check never saw it: the loading state simply looked
 * broken, on every screen, every time anything loaded.
 */

export function KPICardSkeleton() {
  return (
    <div className="glass rounded-xl p-6 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-24 max-w-full" />
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      </div>
      <Skeleton className="h-8 w-20 max-w-full" />
      <Skeleton className="h-3 w-32 max-w-full" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <Skeleton className="h-5 w-40 max-w-full" />
      <Skeleton className="h-48 sm:h-64 w-full rounded-lg" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex flex-wrap gap-3">
        <Skeleton className="h-9 flex-1 min-w-[8rem]" />
        <Skeleton className="h-9 w-24 shrink-0" />
        <Skeleton className="h-9 w-24 shrink-0" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton className="h-4 w-3/4 max-w-[12rem]" />
              <Skeleton className="h-3 w-1/2 max-w-[8rem]" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Skeleton className="h-8 w-32 sm:w-48 max-w-full" />
        <div className="flex gap-2 shrink-0">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-6 w-full" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={`c-${i}`} className="h-12 sm:h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="glass rounded-xl p-6 space-y-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-4 w-24 max-w-full mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 max-w-full rounded-lg" />
    </div>
  );
}
