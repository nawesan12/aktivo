import { cn } from "@/lib/utils";

/**
 * The landing's rhythm, in one place.
 *
 * Every section in the design is the same shape: 64px of side padding on
 * desktop, 22px on a phone, a hairline on top and one of three grounds — white,
 * the dotted page, or the dotted page with a jade wash behind a hero. They were
 * eleven separate CSS rules before, and three of them had drifted apart.
 */
export function Section({
  as: Tag = "section",
  ground = "page",
  border = true,
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  as?: "section" | "footer" | "div";
  ground?: "page" | "card" | "hero";
  border?: boolean;
}) {
  const Element = Tag as React.ElementType;
  return (
    <Element
      className={cn(
        "px-[22px] sm:px-10 lg:px-16",
        border && "border-t border-border-subtle",
        ground === "card" && "bg-card",
        ground === "page" && "bg-dots",
        ground === "hero" && "bg-hero-jade relative overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </Element>
  );
}

/** The label above a section title: small, uppercase, wide-tracked, jade. */
export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-jade-link">
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-[30px] font-extrabold leading-[1.1] tracking-[-0.04em] sm:text-[38px]",
        className
      )}
    >
      {children}
    </h2>
  );
}
