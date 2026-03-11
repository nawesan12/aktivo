"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

const sizes = {
  xs: { icon: 16, text: "text-sm" },
  sm: { icon: 24, text: "text-lg" },
  md: { icon: 32, text: "text-2xl" },
  lg: { icon: 40, text: "text-3xl" },
  xl: { icon: 48, text: "text-4xl" },
} as const;

interface JikuLogoProps {
  size?: keyof typeof sizes;
  iconOnly?: boolean;
  className?: string;
  animated?: boolean;
}

function LogoIcon({ size = 24, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <Image
      src="/jiku-logo.png"
      alt=""
      width={size}
      height={size}
      aria-hidden
      className={animated ? "jiku-logo-animated" : undefined}
      style={{ width: size, height: size }}
      priority
    />
  );
}

export function JikuLogo({ size = "sm", iconOnly = false, className, animated = false }: JikuLogoProps) {
  const config = sizes[size];

  if (iconOnly) {
    return (
      <div className={cn("shrink-0", className)}>
        <LogoIcon size={config.icon} animated={animated} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 shrink-0", className)}>
      <LogoIcon size={config.icon} animated={animated} />
      <span
        className={cn("font-heading font-bold", config.text)}
        style={{ color: "#4ADE80", letterSpacing: "-0.03em" }}
      >
        jiku
      </span>
    </div>
  );
}

export function JikuIcon({ size = 24, className, animated = false }: { size?: number; className?: string; animated?: boolean }) {
  return (
    <div className={cn("shrink-0", className)}>
      <LogoIcon size={size} animated={animated} />
    </div>
  );
}
