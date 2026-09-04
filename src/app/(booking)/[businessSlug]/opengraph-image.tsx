import { ImageResponse } from "next/og";
import { getBusinessProfile, getUncategorizedServices } from "@/lib/booking/business-page";
import { loadGoogleFont } from "@/lib/og-fonts";
import { isHexColor, contrastColor } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

export const alt = "Reservá tu turno";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

/**
 * Generated once and reused, like the page it belongs to.
 *
 * Rendering it fetches three fonts from Google and reads the business, and
 * social crawlers ask for it every time a link is pasted anywhere. Left
 * dynamic, that is a function invocation and three network round trips per
 * share.
 */
export const revalidate = 600;

export function generateStaticParams() {
  return [];
}

const INK = "#09090b";

/**
 * The card each business gets when its link is shared.
 *
 * Every business used to fall back to Jiku's generic card, so a barbershop
 * sending its link on WhatsApp advertised the platform instead of itself. This
 * one carries their name, their colours and what they actually sell.
 */
export default async function BusinessOGImage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const business = await getBusinessProfile(businessSlug);

  const [sora, soraRegular, mono] = await Promise.all([
    loadGoogleFont("Sora", 700),
    loadGoogleFont("Sora", 400),
    loadGoogleFont("IBM Plex Mono", 500),
  ]);

  const fonts = [
    { name: "Sora", data: sora, style: "normal" as const, weight: 700 as const },
    { name: "Sora", data: soraRegular, style: "normal" as const, weight: 400 as const },
    { name: "IBM Plex Mono", data: mono, style: "normal" as const, weight: 500 as const },
  ];

  if (!business) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: INK,
            color: "#fafafa",
            fontFamily: "Sora",
            fontSize: "44px",
          }}
        >
          Jiku
        </div>
      ),
      { ...size, fonts }
    );
  }

  const primary = isHexColor(business.primaryColor) ? business.primaryColor : "#4ADE80";
  const accent = isHexColor(business.accentColor) ? business.accentColor : "#22D3EE";
  const onPrimary = contrastColor(primary);

  // Uncategorised services count too: a business that never made categories —
  // the common case for a new one — would otherwise get a card with no prices.
  const services = [
    ...business.categories.flatMap((category) => category.services),
    ...(await getUncategorizedServices(business.id)),
  ].slice(0, 3);

  const city = [business.city, business.province].filter(Boolean).join(", ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: INK,
          padding: "72px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* The business's own colour, lighting the card from the corner. */}
        <div
          style={{
            position: "absolute",
            right: "-200px",
            top: "-200px",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${primary}33 0%, transparent 70%)`,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "20px",
              background: `linear-gradient(135deg, ${primary}, ${accent})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: onPrimary,
              fontFamily: "Sora",
              fontSize: "34px",
              fontWeight: 700,
            }}
          >
            {business.name.charAt(0).toUpperCase()}
          </div>
          {city && (
            <div
              style={{
                display: "flex",
                fontFamily: "IBM Plex Mono",
                fontSize: "19px",
                color: "#a1a1aa",
                letterSpacing: "1px",
              }}
            >
              {city.toUpperCase()}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            fontFamily: "Sora",
            fontWeight: 700,
            fontSize: business.name.length > 26 ? "58px" : "72px",
            color: "#fafafa",
            letterSpacing: "-2px",
            lineHeight: 1.1,
            marginTop: "32px",
            maxWidth: "980px",
          }}
        >
          {business.name}
        </div>

        <div
          style={{
            display: "flex",
            fontFamily: "Sora",
            fontWeight: 400,
            fontSize: "26px",
            color: primary,
            marginTop: "16px",
          }}
        >
          Reservá tu turno online
        </div>

        {services.length > 0 && (
          <div style={{ display: "flex", gap: "12px", marginTop: "40px" }}>
            {services.map((service) => (
              <div
                key={service.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 22px",
                  borderRadius: "9999px",
                  border: `1px solid ${primary}55`,
                  fontFamily: "Sora",
                  fontWeight: 400,
                  fontSize: "20px",
                  color: "#e4e4e7",
                }}
              >
                {service.name}
                <span style={{ color: primary, display: "flex" }}>
                  {formatCurrency(Number(service.price))}
                </span>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            fontFamily: "IBM Plex Mono",
            fontSize: "19px",
            color: "#71717a",
            marginTop: "48px",
          }}
        >
          jikuapp.com/{business.slug}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
