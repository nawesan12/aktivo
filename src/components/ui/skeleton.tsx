import { cn } from "@/lib/utils"

/**
 * A placeholder that breathes.
 *
 * Tailwind's `animate-pulse` runs at 2s with every element in lockstep, which
 * reads as a flashing block. The design asks for a slower ~1.6s cycle and a
 * stagger: `--stagger` shifts one placeholder against the next, so a column of
 * them ripples instead of blinking as one.
 */
function Skeleton({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md bg-muted [animation:skeleton-pulse_1.6s_ease-in-out_infinite]", className)}
      style={style}
      {...props}
    />
  )
}

export { Skeleton }
