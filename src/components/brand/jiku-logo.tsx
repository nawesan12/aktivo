import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Sizes come from the design: the mark is 26px next to a 19px wordmark in the
 * landing nav, and everything else is that ratio scaled.
 */
const sizes = {
  xs: { icon: 18, text: "text-[13px]", kanji: "text-[10px]" },
  sm: { icon: 22, text: "text-[16px]", kanji: "text-[12px]" },
  md: { icon: 26, text: "text-[19px]", kanji: "text-[14px]" },
  lg: { icon: 34, text: "text-[24px]", kanji: "text-[17px]" },
  xl: { icon: 46, text: "text-[32px]", kanji: "text-[22px]" },
} as const;

interface JikuLogoProps {
  size?: keyof typeof sizes;
  iconOnly?: boolean;
  /** The 軸 that sits after the wordmark in the landing nav. */
  withKanji?: boolean;
  /**
   * "default" takes the surrounding text colour — the landing nav and the
   * footer, where the wordmark is near-black. "jade" is the panel sidebar,
   * where it is the only coloured thing on a dark surface.
   */
  tone?: "default" | "jade";
  className?: string;
}

function LogoIcon({ size }: { size: number }) {
  return (
    <Image
      /*
        The transparent PNG, not /jiku-logo.svg. That SVG is a potrace trace with
        fill="#000000" — a solid black square with the glyph knocked out of it —
        so it only ever worked because the app was dark. On the light page it is
        a black tile. It is still there for the favicon and the manifest, where a
        square is what is wanted.
      */
      src="/jiku-logo-t.png"
      alt=""
      width={size}
      height={size}
      aria-hidden
      style={{ width: size, height: size }}
      priority
    />
  );
}

export function JikuLogo({
  size = "sm",
  iconOnly = false,
  withKanji = false,
  tone = "default",
  className,
}: JikuLogoProps) {
  const config = sizes[size];

  if (iconOnly) {
    return (
      <div className={cn("shrink-0", className)}>
        <LogoIcon size={config.icon} />
      </div>
    );
  }

  return (
    <div className={cn("flex shrink-0 items-center gap-[9px]", className)}>
      <LogoIcon size={config.icon} />
      {/*
        The wordmark takes the surrounding text colour rather than a hardcoded
        #4ADE80. It has to read on the pale page, on the dark sidebar and on a
        business's own brand colour, and jade only worked on one of the three.
      */}
      <span
        className={cn(
          "font-heading font-bold tracking-[-0.03em]",
          config.text,
          tone === "jade" && "text-primary"
        )}
      >
        jiku
      </span>
      {withKanji && (
        <span
          className={cn(
            "font-serif",
            config.kanji,
            tone === "jade" ? "text-primary/40" : "text-jade-link/50"
          )}
          aria-hidden
        >
          軸
        </span>
      )}
    </div>
  );
}

export function JikuIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <div className={cn("shrink-0", className)}>
      <LogoIcon size={size} />
    </div>
  );
}
