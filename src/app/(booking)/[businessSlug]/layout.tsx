import type { ReactNode } from "react";
import Link from "next/link";
import { getBusinessProfile } from "@/lib/booking/business-page";
import { safeImageUrl } from "@/lib/images";
import { notFound } from "next/navigation";
import { contrastColor, isHexColor } from "@/lib/utils";
import { PLAN_LIMITS } from "@/lib/subscription/config";
import Image from "next/image";

export default async function BookingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;

  // Same load the page and its metadata use: `cache` makes the three share one
  // round trip instead of asking for the same row three times.
  const business = await getBusinessProfile(businessSlug);

  if (!business) notFound();

  // The business's palette, applied to the real Tailwind tokens.
  //
  // This used to write `hexToHsl(...)` into `--primary` — the Tailwind v3 token
  // format, `"142 71% 45%"` — over a v4 theme whose tokens hold actual colours.
  // The result was an invalid declaration that the browser dropped, so every
  // `bg-primary`, `text-primary` and `border-primary` on the public page and in
  // the booking wizard painted nothing at all. Neither the business's colour nor
  // Jiku's: nothing.
  const primary = isHexColor(business.primaryColor) ? business.primaryColor : null;
  const accent = isHexColor(business.accentColor) ? business.accentColor : null;

  const brandStyle = {
    ...(primary && {
      "--primary": primary,
      "--primary-foreground": contrastColor(primary),
      "--ring": primary,
    }),
    ...(accent && {
      "--accent": accent,
      "--accent-foreground": contrastColor(accent),
    }),
  } as React.CSSProperties;

  return (
    <div style={brandStyle} className="min-h-screen">
      {/* Minimal header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/${business.slug}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {safeImageUrl(business.logo) ? (
              <Image
                src={safeImageUrl(business.logo)!}
                alt={business.name}
                width={28}
                height={28}
                className="w-7 h-7 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ background: `linear-gradient(135deg, ${business.primaryColor || "#6366f1"}, ${business.accentColor || "#22d3ee"})` }}
              >
                {business.name.charAt(0)}
              </div>
            )}
            <span className="font-heading font-semibold">{business.name}</span>
          </Link>
        </div>
      </header>
      <main id="contenido" className="pt-14">{children}</main>

      {/* "Marca blanca" is sold as part of the top plan and until now removed
          nothing, because there was no Jiku anywhere on the page to remove.
          This is the thing it takes away: a single line of credit at the foot
          of the page, gone for whoever pays for the plan that promises it. */}
      {!PLAN_LIMITS[business.plan].whiteLabel && (
        <footer className="py-8 text-center">
          <a
            href="https://jikuapp.com"
            target="_blank"
            rel="noopener"
            className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          >
            Turnos con Jiku
          </a>
        </footer>
      )}
    </div>
  );
}
