import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "Aktivo - Plataforma de turnos, CRM y pagos para negocios de servicios en Argentina";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient accent top-left */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            left: "-120px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        {/* Gradient accent bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: "-120px",
            right: "-120px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            A
          </div>
          <span
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "white",
              letterSpacing: "-1px",
            }}
          >
            Aktivo
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: 600,
            color: "#e4e4e7",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.3,
            display: "flex",
          }}
        >
          Plataforma de Crecimiento para Negocios de Servicios
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: "20px",
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: "650px",
            marginTop: "16px",
            lineHeight: 1.5,
            display: "flex",
          }}
        >
          Turnos, CRM, pagos y fidelizacion. Todo en una sola plataforma.
        </div>

        {/* Pills */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "32px",
          }}
        >
          {["Turnos Online", "MercadoPago", "WhatsApp", "CRM"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 20px",
                borderRadius: "9999px",
                border: "1px solid rgba(99,102,241,0.4)",
                color: "#a5b4fc",
                fontSize: "16px",
                display: "flex",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
