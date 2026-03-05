import { cn } from "@/lib/utils";

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
}

/**
 * Jiku brand icon — axis circle (circle with vertical + horizontal lines)
 * in jade green. Represents the central axis around which everything revolves.
 */
function LogoIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Circle */}
      <circle cx="24" cy="24" r="21" stroke="#4ADE80" strokeWidth="3" fill="none" />
      {/* Vertical axis */}
      <line x1="24" y1="8" x2="24" y2="40" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" />
      {/* Horizontal axis */}
      <line x1="8" y1="24" x2="40" y2="24" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function JikuLogo({ size = "sm", iconOnly = false, className }: JikuLogoProps) {
  const config = sizes[size];

  if (iconOnly) {
    return (
      <div className={cn("shrink-0", className)}>
        <LogoIcon size={config.icon} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 shrink-0", className)}>
      <LogoIcon size={config.icon} />
      <span className={cn("font-heading font-bold", config.text)} style={{ color: "#4ADE80" }}>
        jiku
      </span>
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
