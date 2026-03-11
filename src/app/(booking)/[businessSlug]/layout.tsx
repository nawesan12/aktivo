import type { ReactNode } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { hexToHsl } from "@/lib/utils";

export default async function BookingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;

  const business = await db.business.findUnique({
    where: { slug: businessSlug },
    select: {
      name: true,
      slug: true,
      logo: true,
      primaryColor: true,
      accentColor: true,
    },
  });

  if (!business) notFound();

  // Inject per-business CSS custom properties
  const brandStyle = {
    "--business-primary": business.primaryColor || "#6366f1",
    "--business-accent": business.accentColor || "#22d3ee",
  } as React.CSSProperties;

  // Override Tailwind --primary so all bg-primary/text-primary use business color
  const primaryHsl = business.primaryColor ? hexToHsl(business.primaryColor) : null;

  return (
    <div style={brandStyle} className="min-h-screen">
      {primaryHsl && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root { --primary: ${primaryHsl}; }
        ` }} />
      )}
      {/* Minimal header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/${business.slug}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
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
      <main className="pt-14">{children}</main>
    </div>
  );
}
