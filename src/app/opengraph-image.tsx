import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-fonts";

export const alt =
  "Jiku — tu agenda se mueve sola. Turnos online, cobros y recordatorios para barberías y salones.";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const JADE = "#4ADE80";
const INK = "#09090b";

/**
 * The card that shows up when somebody shares jikuapp.com.
 *
 * Built around the product's own line rather than a category description: "tu
 * agenda se mueve sola" says what it does, "Plataforma de Crecimiento para
 * Negocios de Servicios" says what every SaaS says.
 *
 * The vertical rule on the left is the axis the landing page is built around —
 * same shape, so the card and the site read as one thing. On the right is a
 * day's worth of slots with one being taken, which is the whole product in a
 * picture and needs no translation.
 */
export default async function OGImage() {
  const [soraBold, soraRegular, cormorant, mono] = await Promise.all([
    loadGoogleFont("Sora", 700),
    loadGoogleFont("Sora", 400),
    loadGoogleFont("Cormorant Garamond", 600, { italic: true }),
    loadGoogleFont("IBM Plex Mono", 500),
  ]);

  const slots = [
    { time: "09:00", label: "Corte clásico", taken: true },
    { time: "09:30", label: "Corte + barba", taken: true },
    { time: "10:00", label: "Reservando…", taken: false },
    { time: "10:30", label: "Color", taken: true },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: INK,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow behind the axis, so the line reads as lit rather than drawn. */}
        <div
          style={{
            position: "absolute",
            left: "-260px",
            top: "-25px",
            width: "640px",
            height: "640px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(74,222,128,0.22) 0%, transparent 68%)",
            display: "flex",
          }}
        />

        {/* The axis. */}
        <div
          style={{
            position: "absolute",
            left: "84px",
            top: "0px",
            width: "2px",
            height: "630px",
            background: `linear-gradient(180deg, transparent 0%, ${JADE} 22%, ${JADE} 78%, transparent 100%)`,
            display: "flex",
          }}
        />

        {/* Left: the promise. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: "132px",
            paddingRight: "40px",
            width: "660px",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "IBM Plex Mono",
              fontSize: "20px",
              letterSpacing: "6px",
              color: JADE,
            }}
          >
            JIKU
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Sora",
              fontSize: "72px",
              fontWeight: 700,
              color: "#fafafa",
              letterSpacing: "-3px",
              lineHeight: 1.05,
              marginTop: "26px",
            }}
          >
            Tu agenda
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Cormorant Garamond",
              fontStyle: "italic",
              fontSize: "82px",
              color: JADE,
              lineHeight: 1.05,
              letterSpacing: "-1px",
            }}
          >
            se mueve sola
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Sora",
              fontWeight: 400,
              fontSize: "23px",
              color: "#a1a1aa",
              marginTop: "28px",
              lineHeight: 1.45,
              maxWidth: "480px",
            }}
          >
            Reservas 24/7, cobros con Mercado Pago y recordatorios automáticos.
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "40px",
              fontFamily: "IBM Plex Mono",
              fontSize: "21px",
              color: "#fafafa",
            }}
          >
            jikuapp.com
          </div>
        </div>

        {/* Right: a day, filling up. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            paddingRight: "72px",
          }}
        >
          {slots.map((slot) => (
            <div
              key={slot.time}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontFamily: "IBM Plex Mono",
                  fontSize: "19px",
                  color: slot.taken ? "#52525b" : JADE,
                  width: "62px",
                }}
              >
                {slot.time}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "22px",
                  paddingRight: "22px",
                  height: "62px",
                  flex: 1,
                  borderRadius: "14px",
                  backgroundColor: slot.taken ? "#18181b" : "rgba(74,222,128,0.12)",
                  border: slot.taken
                    ? "1px solid rgba(255,255,255,0.07)"
                    : `2px solid ${JADE}`,
                  fontFamily: "Sora",
                  fontWeight: slot.taken ? 400 : 700,
                  fontSize: "20px",
                  color: slot.taken ? "#d4d4d8" : JADE,
                }}
              >
                {slot.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Sora", data: soraBold, style: "normal", weight: 700 },
        { name: "Sora", data: soraRegular, style: "normal", weight: 400 },
        { name: "Cormorant Garamond", data: cormorant, style: "italic", weight: 600 },
        { name: "IBM Plex Mono", data: mono, style: "normal", weight: 500 },
      ],
    }
  );
}
