import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "Jiku - Plataforma de turnos, CRM y pagos para negocios de servicios en Argentina";

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
              "radial-gradient(circle, rgba(74,222,128,0.4) 0%, transparent 70%)",
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
              "radial-gradient(circle, rgba(34,197,85,0.3) 0%, transparent 70%)",
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
              background: "linear-gradient(135deg, #4ADE80, #22c55e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            J
          </div>
          <span
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "white",
              letterSpacing: "-1px",
            }}
          >
            Jiku
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
                border: "1px solid rgba(74,222,128,0.4)",
                color: "#86efac",
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
