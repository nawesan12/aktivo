import { cn } from "@/lib/utils";

/**
 * The turning axis behind the philosophy section: concentric rings with one
 * bright jade dot riding the outer edge, and 軸 held still at the centre.
 *
 * The rotation is slow on purpose — 70 seconds for a full turn reads as drift
 * rather than as an animation. `prefers-reduced-motion` stops it outright
 * (handled globally in globals.css), and the layout is identical either way.
 */
export function AxisRing({
  size = 260,
  seconds = 70,
  className,
}: {
  size?: number;
  seconds?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/*
        inset-[5px], not inset-0: the dot rides the ring's edge, so with the
        ring flush to the container it swings 4px past it on every side — six
        pixels of horizontal scroll on a phone, from a decoration.
      */}
      <div
        className="absolute inset-[5px] rounded-full border border-jade-link/20"
        style={{ animation: `axis-spin ${seconds}s linear infinite` }}
      >
        <div
          className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
          style={{ boxShadow: "0 0 12px rgba(74, 222, 128, 0.8)" }}
        />
      </div>
      <div
        className="absolute rounded-full border border-jade-link/[0.12]"
        style={{ width: size * 0.73, height: size * 0.73 }}
      />
      <span className="font-serif leading-none text-jade-link" style={{ fontSize: size * 0.46 }}>
        軸
      </span>
    </div>
  );
}
