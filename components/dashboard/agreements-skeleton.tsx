import { Skeleton } from "@/components/ui/skeleton"

/**
 * Placeholder for the agreements list while it loads.
 *
 * The list is assembled from two independent reads — agreements from Nest and
 * escrows read on-chain by role — and only the first used to gate the render.
 * The second then arrived into a list already on screen, so the section
 * counters jumped ("Needs Action 14" becoming 19 a moment later) with nothing
 * to suggest more was still coming.
 *
 * Shaped like the rows it stands in for, so the layout does not shift when the
 * real ones land.
 */
export function AgreementsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading agreements</span>

      {/* Filter row */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
        <Skeleton className="h-9 w-36 rounded-full" />
        <Skeleton className="ml-auto h-9 w-48 rounded-lg" />
      </div>

      {/* The three status tiles, whose counts are what visibly jumped */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={`tile-${i}`} className="h-16 rounded-xl" />
        ))}
      </div>

      {/* Agreement rows */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={`row-${i}`}
            className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#0c1220]/40 p-4"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <div className="hidden flex-col items-end gap-2 sm:flex">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-6 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
