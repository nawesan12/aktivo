import type { ReactNode } from "react";
import { getBusinessProfile } from "@/lib/booking/business-page";
import { notFound } from "next/navigation";
import { contrastColor, isHexColor } from "@/lib/utils";
import { PLAN_LIMITS } from "@/lib/subscription/config";
import { PublicHeader } from "@/components/layout/public-header";

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
    // --brand-accent, not --accent: the latter is the neutral hover surface that
    // every ghost button and dropdown row reads, and painting it with the shop's
    // colour turned each of those hovers into a block of saturated brand colour.
    // The gradient is the only thing that wants this second colour.
    ...(accent && { "--brand-accent": accent }),
  } as React.CSSProperties;

  return (
    <div style={brandStyle} className="bg-dots flex min-h-screen flex-col">
      {/*
        Not an app header: a translucent bar carrying the shop's own name, so
        the cover photo still opens the page and there is no second, smaller
        identity competing with the real one. What it adds is the way out —
        without it, finishing a booking was a dead end, and the shop's own
        customers had nowhere to reach the appointment they had just made.
      */}
      <PublicHeader
        brand={{ name: business.name, href: `/${businessSlug}`, logo: business.logo }}
        transparent
        whiteLabel={PLAN_LIMITS[business.plan].whiteLabel}
      />

      <main id="contenido" className="flex-1">
        {children}
      </main>

      {/* "Marca blanca" is sold as part of the top plan and until now removed
          nothing, because there was no Jiku anywhere on the page to remove.
          This is the thing it takes away: a single line of credit at the foot
          of the page, gone for whoever pays for the plan that promises it. */}
      {!PLAN_LIMITS[business.plan].whiteLabel && (
        <footer className="safe-bottom pt-8 text-center [--safe-bottom:32px]">
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
