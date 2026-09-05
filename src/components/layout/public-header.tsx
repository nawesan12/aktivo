import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Compass } from "lucide-react";

import { JikuLogo } from "@/components/brand/jiku-logo";
import { safeImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

interface PublicHeaderProps {
  /**
   * A shop's own identity, when the header sits over its page. Without it the
   * bar carries Jiku's.
   */
  brand?: { name: string; href: string; logo?: string | null };
  /** Lets the shop's cover photo show through. */
  transparent?: boolean;
  /** Drops the platform's name entirely, for the plan that pays to remove it. */
  whiteLabel?: boolean;
}

/**
 * The way out of every public screen.
 *
 * There was none. `(public)` and `(booking)` mounted providers and nothing
 * else, and the shop layout removed its header on purpose so each screen would
 * open on the cover photo. The cost was that finishing a booking left you on a
 * confirmation page whose only links were "reschedule" and "share": no way back
 * to the shop, none to the directory, and none to your own appointments.
 *
 * Deliberately session-free. Reading the session here would turn the shop pages
 * and the directory — static and ISR today — into a function invocation per
 * visitor, and it buys nothing: "Mis turnos" resolves who you are on arrival,
 * so a signed-in customer walks straight in.
 */
export function PublicHeader({ brand, transparent, whiteLabel }: PublicHeaderProps) {
  const logo = brand?.logo ? safeImageUrl(brand.logo) : null;

  return (
    <header
      className={cn(
        "safe-top safe-x sticky top-0 z-40 border-b",
        transparent
          ? "border-transparent bg-background/70 backdrop-blur-md"
          : "border-border bg-card"
      )}
    >
      <nav
        aria-label="Principal"
        className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4"
      >
        {brand ? (
          <Link
            href={brand.href}
            className="flex min-w-0 items-center gap-2 text-[13.5px] font-bold tracking-[-0.01em]"
          >
            {logo && (
              <Image
                src={logo}
                alt=""
                width={24}
                height={24}
                className="size-6 shrink-0 rounded-md object-cover"
              />
            )}
            <span className="truncate">{brand.name}</span>
          </Link>
        ) : (
          <Link href="/" aria-label="Jiku, inicio">
            <JikuLogo size="sm" />
          </Link>
        )}

        <div className="flex shrink-0 items-center gap-1">
          {!whiteLabel && (
            <Link
              href="/explorar"
              className="inline-flex items-center gap-1.5 rounded-[9px] px-3 py-2 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Compass className="size-4" aria-hidden />
              {/* Hidden, not removed: on a phone this is an icon on its own,
                  and `hidden` would leave the link with no accessible name. */}
              <span className="max-sm:sr-only">Explorar</span>
            </Link>
          )}
          <Link
            href="/mis-turnos"
            className="inline-flex items-center gap-1.5 rounded-[9px] border border-border px-3 py-2 text-[12.5px] font-semibold transition-colors hover:border-faint"
          >
            <CalendarCheck className="size-4" aria-hidden />
            Mis turnos
          </Link>
        </div>
      </nav>
    </header>
  );
}
