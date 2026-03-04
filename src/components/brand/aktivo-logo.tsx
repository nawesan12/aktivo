import { cn } from "@/lib/utils";

const sizes = {
  xs: { icon: 16, text: "text-sm" },
  sm: { icon: 24, text: "text-lg" },
  md: { icon: 32, text: "text-2xl" },
  lg: { icon: 40, text: "text-3xl" },
  xl: { icon: 48, text: "text-4xl" },
} as const;

interface AktivoLogoProps {
  size?: keyof typeof sizes;
  iconOnly?: boolean;
  className?: string;
}

/**
 * Aktivo brand icon — a dynamic lightning bolt merged with a calendar/clock motif.
 * Represents energy, scheduling, and motion. Forward-leaning, premium feel.
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
      <defs>
        <linearGradient id="aktivo-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect width="48" height="48" rx="12" fill="url(#aktivo-grad)" />
      {/* Lightning bolt — represents energy & speed */}
      <path
        d="M27.5 8L14 26h9l-2.5 14L34 22h-9l2.5-14Z"
        fill="white"
        fillOpacity="0.95"
      />
      {/* Subtle clock arc — represents scheduling */}
      <path
        d="M36 12a20 20 0 0 1 4 12"
        stroke="white"
        strokeOpacity="0.4"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function AktivoLogo({ size = "sm", iconOnly = false, className }: AktivoLogoProps) {
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
      <span className={cn("font-heading font-bold brand-text", config.text)}>
        Aktivo
      </span>
    </div>
  );
}

export function AktivoIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <div className={cn("shrink-0", className)}>
      <LogoIcon size={size} />
    </div>
  );
}
