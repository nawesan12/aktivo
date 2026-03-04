import { Skeleton } from "@/components/ui/skeleton";

export function ServiceSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-60" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function StaffSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-56" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function DatetimeSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-44" />
      <Skeleton className="h-4 w-60" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function InfoSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-4 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
      <Skeleton className="h-10 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
  );
}

export function ConfirmSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
      <div className="flex justify-center">
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>
    </div>
  );
}

export function BusinessProfileSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="relative h-72 sm:h-96">
        <Skeleton className="absolute inset-0" />
      </div>
      {/* Quick info */}
      <div className="max-w-4xl mx-auto px-4 -mt-4 mb-12">
        <Skeleton className="h-16 rounded-2xl" />
      </div>
      {/* Services */}
      <div className="max-w-4xl mx-auto px-4 mb-16">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Staff */}
      <div className="max-w-4xl mx-auto px-4 mb-16">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
