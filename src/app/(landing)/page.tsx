"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { JikuLogo } from "@/components/brand/jiku-logo";

export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Nav scroll effect
    const handleScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle("scrolled", window.scrollY > 60);
      }
    };
    window.addEventListener("scroll", handleScroll);

    // Reveal on scroll
    const reveals = document.querySelectorAll(".jiku-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    reveals.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="jiku-landing">
      <style dangerouslySetInnerHTML={{ __html: landingStyles }} />

      {/* NAV */}
      <nav ref={navRef} className="jiku-nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <JikuLogo size="md" />
          </Link>
          <div className="nav-links">
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, "#features")}
            >
              Funciones
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleSmoothScroll(e, "#pricing")}
            >
              Planes
            </a>
            <a
              href="#testimonials"
              onClick={(e) => handleSmoothScroll(e, "#testimonials")}
            >
              Reseñas
            </a>
            <Link href="/iniciar-sesion" className="nav-link-login">
              Iniciar sesión
            </Link>
            <Link href="/registrarse" className="btn btn-jade">
              Empezar gratis →
            </Link>
          </div>
          <button
            className={`nav-hamburger ${mobileOpen ? "open" : ""}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="nav-mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="nav-mobile-menu" onClick={(e) => e.stopPropagation()}>
            <a href="#features" onClick={(e) => { handleSmoothScroll(e, "#features"); setMobileOpen(false); }}>
              Funciones
            </a>
            <a href="#pricing" onClick={(e) => { handleSmoothScroll(e, "#pricing"); setMobileOpen(false); }}>
              Planes
            </a>
            <a href="#testimonials" onClick={(e) => { handleSmoothScroll(e, "#testimonials"); setMobileOpen(false); }}>
              Reseñas
            </a>
            <Link href="/iniciar-sesion" onClick={() => setMobileOpen(false)}>
              Iniciar sesión
            </Link>
            <Link href="/registrarse" className="btn btn-jade" onClick={() => setMobileOpen(false)}>
              Empezar gratis →
            </Link>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="hero">
        <div className="hero-axis" />
        <div className="hero-glow" />
        <div className="container">
          <div className="hero-content">
            <div className="hero-left">
              <div className="hero-kanji serif">軸 · EL EJE DE TU NEGOCIO</div>
              <h1>
                Tu agenda
                <br />
                <span className="line-2 serif">se mueve sola</span>
              </h1>
              <p className="hero-desc">
                Reservas 24/7. WhatsApp automático. Cobros integrados. CRM
                inteligente. Todo girando alrededor de un solo eje: Jiku.
              </p>
              <div className="hero-ctas">
                <Link href="/registrarse" className="btn btn-jade">
                  Probar 15 días gratis →
                </Link>
                <a
                  href="#features"
                  className="btn btn-ghost"
                  onClick={(e) => handleSmoothScroll(e, "#features")}
                >
                  Ver demo en vivo
                </a>
              </div>
              <div className="hero-metrics">
                <div>
                  <div className="hero-metric-num">12,400+</div>
                  <div className="hero-metric-label">Negocios activos</div>
                </div>
                <div>
                  <div className="hero-metric-num">2.8M</div>
                  <div className="hero-metric-label">Turnos / mes</div>
                </div>
                <div>
                  <div className="hero-metric-num">-73%</div>
                  <div className="hero-metric-label">Ausencias</div>
                </div>
              </div>
            </div>

            {/* PHONE */}
            <div className="hero-right">
              <div className="phone">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <div className="ps-header">
                    <div>
                      <div className="ps-greeting">Buenos días 👋</div>
                      <div className="ps-name">Studio Martín</div>
                    </div>
                    <div className="ps-avatar">SM</div>
                  </div>
                  <div className="ps-stats">
                    <div className="ps-stat">
                      <div className="ps-stat-val green">18</div>
                      <div className="ps-stat-lbl">Turnos hoy</div>
                    </div>
                    <div className="ps-stat">
                      <div className="ps-stat-val gold">$284k</div>
                      <div className="ps-stat-lbl">Facturado / mes</div>
                    </div>
                  </div>
                  <div className="ps-section">Próximos turnos</div>
                  <div className="ps-appt">
                    <div className="ps-time">
                      <div className="ps-time-h">10:00</div>
                      <div className="ps-time-p">AM</div>
                    </div>
                    <div className="ps-bar g" />
                    <div className="ps-info">
                      <div className="ps-client">Lucía Fernández</div>
                      <div className="ps-service">Corte + Color</div>
                    </div>
                    <span className="ps-badge badge-ok">✓ OK</span>
                  </div>
                  <div className="ps-appt">
                    <div className="ps-time">
                      <div className="ps-time-h">11:30</div>
                      <div className="ps-time-p">AM</div>
                    </div>
                    <div className="ps-bar y" />
                    <div className="ps-info">
                      <div className="ps-client">Matías López</div>
                      <div className="ps-service">Barba + Degradé</div>
                    </div>
                    <span className="ps-badge badge-wait">Espera</span>
                  </div>
                  <div className="ps-appt">
                    <div className="ps-time">
                      <div className="ps-time-h">12:15</div>
                      <div className="ps-time-p">PM</div>
                    </div>
                    <div className="ps-bar p" />
                    <div className="ps-info">
                      <div className="ps-client">Camila Ruiz</div>
                      <div className="ps-service">Alisado definitivo</div>
                    </div>
                    <span className="ps-badge badge-paid">$ Pagado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="trust">
        <div className="container">
          <div className="trust-inner">
            <span className="trust-label">Confían en Jiku</span>
            <div className="trust-logos">
              <span className="trust-logo">BLADE Studio</span>
              <span className="trust-logo">NaturalSpa</span>
              <span className="trust-logo">FitZone</span>
              <span className="trust-logo">Dr. Wellness</span>
              <span className="trust-logo">InkMasters</span>
            </div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="philosophy">
        <div className="philosophy-kanji serif">軸</div>
        <div className="container">
          <div className="philosophy-content jiku-reveal">
            <div className="section-eyebrow">Filosofía</div>
            <h2 className="serif">
              &ldquo;En japonés, 軸 significa eje — el centro alrededor del cual
              todo gira.&rdquo;
            </h2>
            <p>
              Tu negocio tiene un eje: tu agenda, tus clientes, tu tiempo. Jiku
              se convierte en ese centro. Sin eje, todo colapsa. Con Jiku, todo
              fluye.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header jiku-reveal">
            <div className="section-eyebrow">Funciones</div>
            <div className="section-title">
              Todo lo que necesitás.
              <br />
              Nada que sobre.
            </div>
            <p className="section-desc">
              Cada función fue diseñada para resolver problemas reales de
              negocios que viven de su agenda.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature jiku-reveal rd1">
              <div className="feature-num mono">01</div>
              <h3>Agenda inteligente 24/7</h3>
              <p>
                Tus clientes reservan solos a cualquier hora. La IA optimiza
                huecos y sugiere horarios para maximizar tu capacidad.
              </p>
            </div>
            <div className="feature jiku-reveal rd2">
              <div className="feature-num mono">02</div>
              <h3>WhatsApp automático</h3>
              <p>
                Confirmaciones, recordatorios 24h antes y seguimiento
                post-servicio. Todo sin que toques el celular.
              </p>
            </div>
            <div className="feature jiku-reveal rd3">
              <div className="feature-num mono">03</div>
              <h3>Cobros integrados</h3>
              <p>
                Mercado Pago, transferencias, QR y links de pago. Vendé
                paquetes, membresías y señas desde un solo lugar.
              </p>
            </div>
            <div className="feature jiku-reveal rd1">
              <div className="feature-num mono">04</div>
              <h3>CRM que enamora</h3>
              <p>
                Historial completo de cada cliente. Campañas automáticas de
                fidelización, cumpleaños y reactivación.
              </p>
            </div>
            <div className="feature jiku-reveal rd2">
              <div className="feature-num mono">05</div>
              <h3>Reportes accionables</h3>
              <p>
                Insights reales: tu servicio estrella, tu mejor horario, qué
                profesional factura más. No solo datos, respuestas.
              </p>
            </div>
            <div className="feature jiku-reveal rd3">
              <div className="feature-num mono">06</div>
              <h3>Programa de fidelidad</h3>
              <p>
                Puntos, recompensas y tarjetas de sellos digitales. Tus clientes
                vuelven más seguido y gastan más.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BIG FEATURE */}
      <section className="big-feature">
        <div className="container">
          <div className="big-feature-grid">
            <div className="jiku-reveal">
              <div className="section-eyebrow">Comunicación</div>
              <div className="section-title">
                WhatsApp en
                <br />
                piloto automático
              </div>
              <p className="section-desc" style={{ marginTop: 16 }}>
                El 98% de tus clientes usa WhatsApp. Jiku envía confirmaciones,
                recordatorios y mensajes post-servicio para pedir reseñas. Todo
                automático, todo personalizado.
              </p>
              <div
                style={{ marginTop: 32, display: "flex", gap: 32 }}
              >
                <div>
                  <div className="jade" style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                    -73%
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    ausencias
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--gold)" }}>
                    +45%
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    reseñas en Google
                  </div>
                </div>
              </div>
            </div>
            <div className="bf-visual jiku-reveal rd3">
              <div className="wa">
                <div className="wa-head">
                  <div className="wa-icon">💬</div>
                  <div>
                    <div className="wa-name">Jiku Bot</div>
                    <div className="wa-sub">Mensajes automáticos</div>
                  </div>
                </div>
                <div className="wa-msgs">
                  <div className="wa-msg">
                    <strong>¡Hola Lucía! 👋</strong>
                    <br />
                    Te recordamos tu turno mañana a las 10:00 con Martín.
                    <br />
                    Servicio: Corte + Color
                    <br />
                    <br />
                    ✅ Confirmar &nbsp; ❌ Cancelar
                    <span className="wa-time">14:30</span>
                  </div>
                  <div className="wa-msg">
                    <strong>¡Turno confirmado!</strong> ✨
                    <br />
                    Te esperamos mañana. Llegá 5 min antes.
                    <br />
                    📍 Av. Santa Fe 2431, CABA
                    <span className="wa-time">14:31</span>
                  </div>
                  <div className="wa-msg">
                    <strong>¡Gracias por tu visita!</strong> 💇‍♀️
                    <br />
                    ¿Cómo fue tu experiencia? Dejanos tu reseña y sumá puntos 🎁
                    <span className="wa-time">12:15</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card jiku-reveal">
              <div className="stat-num">73%</div>
              <div className="stat-label">Menos ausencias</div>
            </div>
            <div className="stat-card jiku-reveal rd1">
              <div className="stat-num">2.4x</div>
              <div className="stat-label">Más reservas online</div>
            </div>
            <div className="stat-card jiku-reveal rd2">
              <div className="stat-num">15h</div>
              <div className="stat-label">Ahorradas / semana</div>
            </div>
            <div className="stat-card jiku-reveal rd3">
              <div className="stat-num">4.9★</div>
              <div className="stat-label">Calificación promedio</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="container">
          <div className="jiku-reveal" style={{ textAlign: "center" }}>
            <div className="section-eyebrow">Planes</div>
            <div className="section-title">
              Simple. Transparente.
              <br />
              Sin letra chica.
            </div>
          </div>
          <div className="pricing-grid">
            <div className="price-card jiku-reveal rd1">
              <div className="price-tier">Starter</div>
              <div className="price-amount">
                <span className="price-sign">$</span>
                <span className="price-val">0</span>
              </div>
              <div className="price-period">Gratis para siempre</div>
              <p className="price-desc">
                Para arrancar. Todo lo básico para dejar la libreta atrás.
              </p>
              <ul className="price-list">
                <li>
                  <span className="price-check">✓</span> 1 profesional
                </li>
                <li>
                  <span className="price-check">✓</span> Reservas 24/7
                </li>
                <li>
                  <span className="price-check">✓</span> Recordatorios WhatsApp
                </li>
                <li>
                  <span className="price-check">✓</span> Hasta 50 turnos/mes
                </li>
              </ul>
              <Link href="/registrarse" className="btn btn-ghost">
                Comenzar gratis
              </Link>
            </div>
            <div className="price-card featured jiku-reveal rd2">
              <div className="price-tier">Pro</div>
              <div className="price-amount">
                <span className="price-sign">$</span>
                <span className="price-val">4.990</span>
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    marginLeft: 4,
                  }}
                >
                  /mes
                </span>
              </div>
              <div className="price-period">ARS · Facturación mensual</div>
              <p className="price-desc">
                Para negocios que quieren crecer en serio.
              </p>
              <ul className="price-list">
                <li>
                  <span className="price-check">✓</span> Hasta 5 profesionales
                </li>
                <li>
                  <span className="price-check">✓</span> Turnos ilimitados
                </li>
                <li>
                  <span className="price-check">✓</span> Cobros con Mercado Pago
                </li>
                <li>
                  <span className="price-check">✓</span> CRM + fidelización
                </li>
                <li>
                  <span className="price-check">✓</span> Reportes avanzados
                </li>
              </ul>
              <Link href="/registrarse?plan=PROFESSIONAL" className="btn btn-jade">
                Elegir Pro →
              </Link>
            </div>
            <div className="price-card jiku-reveal rd3">
              <div className="price-tier">Business</div>
              <div className="price-amount">
                <span className="price-sign">$</span>
                <span className="price-val">9.990</span>
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    marginLeft: 4,
                  }}
                >
                  /mes
                </span>
              </div>
              <div className="price-period">ARS · Facturación mensual</div>
              <p className="price-desc">
                Multi-sucursal, equipo grande, automatización total.
              </p>
              <ul className="price-list">
                <li>
                  <span className="price-check">✓</span> Profesionales
                  ilimitados
                </li>
                <li>
                  <span className="price-check">✓</span> Multi-sucursal
                </li>
                <li>
                  <span className="price-check">✓</span> API + integraciones
                </li>
                <li>
                  <span className="price-check">✓</span> Soporte prioritario
                </li>
                <li>
                  <span className="price-check">✓</span> Marca blanca
                </li>
              </ul>
              <Link href="/registrarse?plan=ENTERPRISE" className="btn btn-ghost">
                Elegir Business →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials" id="testimonials">
        <div className="container">
          <div className="jiku-reveal" style={{ textAlign: "center" }}>
            <div className="section-eyebrow">Reseñas</div>
            <div className="section-title">
              Lo que dicen quienes
              <br />
              usan Jiku
            </div>
          </div>
          <div className="testi-grid">
            <div className="testi-card jiku-reveal rd1">
              <div className="testi-stars">★★★★★</div>
              <p className="testi-text serif">
                &ldquo;Pasé de perder 8 turnos por semana a casi cero. Los
                recordatorios por WhatsApp cambiaron todo. Mis clientes aman
                reservar a las 2am.&rdquo;
              </p>
              <div className="testi-author">
                <div
                  className="testi-avatar"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--jade), var(--jade-deep))",
                  }}
                >
                  MR
                </div>
                <div>
                  <div className="testi-name">Martín Rodríguez</div>
                  <div className="testi-role">Blade Barbería · Palermo</div>
                </div>
              </div>
            </div>
            <div className="testi-card jiku-reveal rd2">
              <div className="testi-stars">★★★★★</div>
              <p className="testi-text serif">
                &ldquo;El CRM me permite saber exactamente qué necesita cada
                clienta. Implementé paquetes y mi facturación subió un 40% en 3
                meses.&rdquo;
              </p>
              <div className="testi-author">
                <div
                  className="testi-avatar"
                  style={{
                    background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                  }}
                >
                  VS
                </div>
                <div>
                  <div className="testi-name">Valentina Sosa</div>
                  <div className="testi-role">Natural Spa · Recoleta</div>
                </div>
              </div>
            </div>
            <div className="testi-card jiku-reveal rd3">
              <div className="testi-stars">★★★★★</div>
              <p className="testi-text serif">
                &ldquo;Tengo 3 sucursales y las manejo desde una sola pantalla.
                Los reportes me dicen exactamente dónde mejorar. Es como tener
                un socio digital.&rdquo;
              </p>
              <div className="testi-author">
                <div
                  className="testi-avatar"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--coral), #ef4444)",
                  }}
                >
                  FC
                </div>
                <div>
                  <div className="testi-name">Federico Castro</div>
                  <div className="testi-role">FitZone · 3 sedes GBA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-axis" />
        <div className="cta-glow" />
        <div className="container">
          <div className="cta-content jiku-reveal">
            <div className="section-eyebrow">Empezá hoy</div>
            <h2>
              Todo gira alrededor
              <br />
              de un <em className="serif">eje</em>
            </h2>
            <p>
              Unite a los 12,400+ negocios que encontraron el suyo. Empezá
              gratis, sin tarjeta, en menos de 3 minutos.
            </p>
            <Link href="/registrarse" className="btn btn-jade">
              Crear mi cuenta gratis →
            </Link>
            <div className="cta-note">
              Sin tarjeta · Setup en 3 min · Cancelá cuando quieras
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="jiku-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Link href="/" className="nav-logo" style={{ marginBottom: 4 }}>
                <JikuLogo size="md" />
              </Link>
              <p className="footer-brand-desc">
                El eje de tu negocio. Más que turnos, crecimiento.
              </p>
            </div>
            <div className="footer-col">
              <h4>Producto</h4>
              <a href="#features" onClick={(e) => handleSmoothScroll(e, "#features")}>
                Funciones
              </a>
              <a href="#pricing" onClick={(e) => handleSmoothScroll(e, "#pricing")}>
                Planes
              </a>
              <a href="#">Integraciones</a>
              <a href="#">API</a>
            </div>
            <div className="footer-col">
              <h4>Recursos</h4>
              <a href="#">Centro de ayuda</a>
              <a href="#">Blog</a>
              <a href="#">Guías</a>
              <a href="#">Status</a>
            </div>
            <div className="footer-col">
              <h4>Empresa</h4>
              <a href="#">Nosotros</a>
              <a href="#">Contacto</a>
              <a href="#">Términos</a>
              <a href="#">Privacidad</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Jiku. Todos los derechos reservados.</span>
            <span className="serif" style={{ fontStyle: "italic", fontSize: "0.85rem" }}>
              軸 — El eje de tu negocio
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SCOPED CSS — injected via dangerouslySetInnerHTML so it does
   not leak into the rest of the app (all selectors live under
   .jiku-landing).
   ════════════════════════════════════════════════════════════════ */
const landingStyles = `
/* ═══ CSS VARIABLES ═══ */
.jiku-landing {
  --bg: #050507;
  --bg-warm: #0a0a0e;
  --surface: #0f0f15;
  --surface-2: #16161e;
  --surface-3: #1c1c26;
  --border: rgba(255,255,255,0.05);
  --border-hover: rgba(255,255,255,0.1);
  --text: #eeedf2;
  --text-secondary: #a09cae;
  --text-muted: #5c5872;
  --jade: #4ADE80;
  --jade-dim: rgba(74,222,128,0.08);
  --jade-glow: rgba(74,222,128,0.15);
  --jade-deep: #22c55e;
  --gold: #fbbf24;
  --gold-dim: rgba(251,191,36,0.08);
  --coral: #fb7185;
  --coral-dim: rgba(251,113,133,0.08);
  --radius: 20px;

  font-family: 'Sora', sans-serif;
  background: var(--bg);
  color: var(--text);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

/* Grain overlay */
.jiku-landing::after {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.025;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 10000;
}

.jiku-landing .serif { font-family: 'Cormorant Garamond', serif; }
.jiku-landing .mono { font-family: 'IBM Plex Mono', monospace; }
.jiku-landing .jade { color: var(--jade); }

.jiku-landing .container { max-width: 1180px; margin: 0 auto; padding: 0 28px; }

/* ═══ REVEAL ═══ */
.jiku-landing .jiku-reveal {
  opacity: 0;
  transform: translateY(50px);
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
}
.jiku-landing .jiku-reveal.visible { opacity: 1; transform: translateY(0); }
.jiku-landing .rd1 { transition-delay: 0.1s; }
.jiku-landing .rd2 { transition-delay: 0.2s; }
.jiku-landing .rd3 { transition-delay: 0.3s; }
.jiku-landing .rd4 { transition-delay: 0.4s; }
.jiku-landing .rd5 { transition-delay: 0.5s; }

/* ═══ NAV ═══ */
.jiku-landing .jiku-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 18px 28px;
  transition: all 0.5s;
}
.jiku-landing .jiku-nav.scrolled {
  background: rgba(5,5,7,0.8);
  backdrop-filter: blur(24px) saturate(1.6);
  border-bottom: 1px solid var(--border);
}
.jiku-landing .nav-inner {
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.jiku-landing .nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text);
}
.jiku-landing .nav-links {
  display: flex;
  align-items: center;
  gap: 36px;
}
.jiku-landing .nav-links a,
.jiku-landing .nav-links .nav-link-login {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 500;
  transition: color 0.3s;
  letter-spacing: 0.01em;
}
.jiku-landing .nav-links a:hover,
.jiku-landing .nav-links .nav-link-login:hover { color: var(--text); }

.jiku-landing .btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 24px;
  border-radius: 100px;
  font-family: 'Sora', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
  text-decoration: none;
  border: none;
  letter-spacing: 0.01em;
}
.jiku-landing .btn-jade {
  background: var(--jade);
  color: var(--bg);
}
.jiku-landing .btn-jade:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 40px var(--jade-glow);
}
.jiku-landing .btn-ghost {
  background: transparent;
  color: var(--text);
  border: 1px solid rgba(255,255,255,0.12);
}
.jiku-landing .btn-ghost:hover {
  border-color: rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.03);
}

/* ═══ HERO ═══ */
.jiku-landing .hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  padding: 140px 0 100px;
  overflow: hidden;
}
.jiku-landing .hero-axis {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 700px;
  height: 700px;
  border: 1px solid rgba(74,222,128,0.04);
  border-radius: 50%;
  pointer-events: none;
  animation: jikuAxisRotate 60s linear infinite;
}
.jiku-landing .hero-axis::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: 500px;
  border: 1px solid rgba(74,222,128,0.03);
  border-radius: 50%;
}
.jiku-landing .hero-axis::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  border: 1px solid rgba(74,222,128,0.025);
  border-radius: 50%;
}
@keyframes jikuAxisRotate {
  from { transform: translate(-50%,-50%) rotate(0); }
  to { transform: translate(-50%,-50%) rotate(360deg); }
}

.jiku-landing .hero-glow {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(74,222,128,0.06), transparent 65%);
  pointer-events: none;
  filter: blur(60px);
}

.jiku-landing .hero-content {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}
.jiku-landing .hero-left {
  animation: jikuHeroFadeIn 1s cubic-bezier(0.16,1,0.3,1) 0.2s both;
}
@keyframes jikuHeroFadeIn {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
.jiku-landing .hero-kanji {
  font-family: 'Cormorant Garamond', serif;
  font-size: 0.9rem;
  color: var(--jade);
  letter-spacing: 0.2em;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}
.jiku-landing .hero-kanji::before {
  content: '';
  width: 32px;
  height: 1px;
  background: var(--jade);
}
.jiku-landing .hero h1 {
  font-size: clamp(3.2rem, 6.5vw, 5rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.045em;
  margin-bottom: 28px;
}
.jiku-landing .hero h1 .line-2 {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-weight: 600;
  color: var(--jade);
  font-size: 1.1em;
}
.jiku-landing .hero-desc {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.7;
  max-width: 460px;
  margin-bottom: 36px;
}
.jiku-landing .hero-ctas {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 48px;
}
.jiku-landing .hero-ctas .btn { padding: 14px 30px; font-size: 0.9rem; }
.jiku-landing .hero-metrics {
  display: flex;
  gap: 40px;
}
.jiku-landing .hero-metric-num {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--jade);
}
.jiku-landing .hero-metric-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 2px;
  letter-spacing: 0.03em;
}

/* Phone mockup */
.jiku-landing .hero-right {
  display: flex;
  justify-content: center;
  animation: jikuHeroFadeIn 1s cubic-bezier(0.16,1,0.3,1) 0.5s both;
}
.jiku-landing .phone {
  width: 300px;
  background: var(--surface);
  border-radius: 40px;
  border: 1.5px solid rgba(255,255,255,0.08);
  padding: 10px;
  box-shadow: 0 60px 120px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05);
  transform: perspective(800px) rotateY(-8deg) rotateX(2deg);
  transition: transform 0.6s cubic-bezier(0.16,1,0.3,1);
}
.jiku-landing .phone:hover { transform: perspective(800px) rotateY(-2deg) rotateX(0deg); }
.jiku-landing .phone-notch {
  width: 100px;
  height: 26px;
  background: var(--bg);
  border-radius: 0 0 16px 16px;
  margin: -10px auto 6px;
  position: relative;
  z-index: 5;
}
.jiku-landing .phone-screen {
  background: var(--bg);
  border-radius: 30px;
  padding: 20px 14px;
  min-height: 500px;
}
.jiku-landing .ps-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.jiku-landing .ps-greeting { font-size: 0.68rem; color: var(--text-muted); }
.jiku-landing .ps-name { font-size: 1.05rem; font-weight: 700; letter-spacing: -0.02em; }
.jiku-landing .ps-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--jade), var(--jade-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.7rem;
  color: var(--bg);
}
.jiku-landing .ps-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
}
.jiku-landing .ps-stat {
  background: var(--surface);
  border-radius: 14px;
  padding: 14px 12px;
  border: 1px solid var(--border);
}
.jiku-landing .ps-stat-val { font-size: 1.3rem; font-weight: 800; letter-spacing: -0.03em; }
.jiku-landing .ps-stat-val.green { color: var(--jade); }
.jiku-landing .ps-stat-val.gold { color: var(--gold); }
.jiku-landing .ps-stat-lbl { font-size: 0.62rem; color: var(--text-muted); margin-top: 2px; }
.jiku-landing .ps-section {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 10px;
}
.jiku-landing .ps-appt {
  background: var(--surface);
  border-radius: 14px;
  padding: 12px;
  border: 1px solid var(--border);
  margin-bottom: 7px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.jiku-landing .ps-time { text-align: center; min-width: 38px; }
.jiku-landing .ps-time-h { font-size: 0.78rem; font-weight: 700; }
.jiku-landing .ps-time-p { font-size: 0.55rem; color: var(--text-muted); text-transform: uppercase; }
.jiku-landing .ps-bar { width: 3px; height: 32px; border-radius: 4px; }
.jiku-landing .ps-bar.g { background: var(--jade); }
.jiku-landing .ps-bar.y { background: var(--gold); }
.jiku-landing .ps-bar.p { background: var(--coral); }
.jiku-landing .ps-info { flex: 1; }
.jiku-landing .ps-client { font-size: 0.78rem; font-weight: 600; }
.jiku-landing .ps-service { font-size: 0.62rem; color: var(--text-muted); }
.jiku-landing .ps-badge {
  font-size: 0.55rem;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 100px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.jiku-landing .badge-ok { background: var(--jade-dim); color: var(--jade); }
.jiku-landing .badge-wait { background: var(--gold-dim); color: var(--gold); }
.jiku-landing .badge-paid { background: var(--coral-dim); color: var(--coral); }

/* ═══ TRUST BAR ═══ */
.jiku-landing .trust {
  padding: 60px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.jiku-landing .trust-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
  flex-wrap: wrap;
}
.jiku-landing .trust-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  font-weight: 600;
}
.jiku-landing .trust-logos {
  display: flex;
  gap: 40px;
  align-items: center;
  opacity: 0.35;
}
.jiku-landing .trust-logo {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
}

/* ═══ PHILOSOPHY ═══ */
.jiku-landing .philosophy {
  padding: 140px 0;
  text-align: center;
  position: relative;
}
.jiku-landing .philosophy-kanji {
  font-family: 'Cormorant Garamond', serif;
  font-size: 12rem;
  color: rgba(74,222,128,0.03);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  user-select: none;
}
.jiku-landing .philosophy-content {
  position: relative;
  z-index: 2;
}
.jiku-landing .section-eyebrow {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--jade);
  font-weight: 700;
  margin-bottom: 20px;
}
.jiku-landing .philosophy h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2.2rem, 5vw, 3.5rem);
  font-weight: 600;
  line-height: 1.2;
  max-width: 700px;
  margin: 0 auto 24px;
  font-style: italic;
}
.jiku-landing .philosophy p {
  font-size: 1.05rem;
  color: var(--text-secondary);
  line-height: 1.7;
  max-width: 560px;
  margin: 0 auto;
}

/* ═══ FEATURES ═══ */
.jiku-landing .features {
  padding: 100px 0;
}
.jiku-landing .section-header {
  margin-bottom: 64px;
}
.jiku-landing .section-title {
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.1;
}
.jiku-landing .section-desc {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-top: 14px;
  max-width: 480px;
  line-height: 1.6;
}
.jiku-landing .features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.jiku-landing .feature {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 36px 28px;
  transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
  position: relative;
}
.jiku-landing .feature::after {
  content: '';
  position: absolute;
  top: 0;
  left: 24px;
  right: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--jade), transparent);
  opacity: 0;
  transition: opacity 0.4s;
}
.jiku-landing .feature:hover::after { opacity: 0.6; }
.jiku-landing .feature:hover {
  border-color: var(--border-hover);
  transform: translateY(-6px);
  box-shadow: 0 24px 64px rgba(0,0,0,0.35);
}
.jiku-landing .feature-num {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: var(--jade);
  font-weight: 500;
  margin-bottom: 20px;
  opacity: 0.6;
}
.jiku-landing .feature h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 10px;
  letter-spacing: -0.02em;
}
.jiku-landing .feature p {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.65;
}

/* ═══ BIG FEATURE ═══ */
.jiku-landing .big-feature {
  padding: 120px 0;
  border-top: 1px solid var(--border);
}
.jiku-landing .big-feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}
.jiku-landing .bf-visual {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 36px;
  position: relative;
  overflow: hidden;
}
.jiku-landing .bf-visual::after {
  content: '';
  position: absolute;
  top: -40%;
  right: -30%;
  width: 70%;
  height: 70%;
  background: radial-gradient(circle, var(--jade-dim), transparent 65%);
  pointer-events: none;
}
/* WhatsApp preview */
.jiku-landing .wa {
  position: relative;
  z-index: 2;
}
.jiku-landing .wa-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 18px;
}
.jiku-landing .wa-icon {
  width: 38px;
  height: 38px;
  background: #25D366;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.jiku-landing .wa-name { font-weight: 700; font-size: 0.9rem; }
.jiku-landing .wa-sub { font-size: 0.68rem; color: var(--text-muted); }
.jiku-landing .wa-msgs { display: flex; flex-direction: column; gap: 10px; }
.jiku-landing .wa-msg {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 14px 14px 14px 4px;
  padding: 14px 16px;
  max-width: 88%;
  font-size: 0.8rem;
  line-height: 1.55;
  color: var(--text-secondary);
}
.jiku-landing .wa-msg strong { color: var(--text); font-weight: 600; }
.jiku-landing .wa-msg .wa-time {
  display: block;
  text-align: right;
  font-size: 0.6rem;
  color: var(--text-muted);
  margin-top: 6px;
}

/* ═══ STATS ═══ */
.jiku-landing .stats {
  padding: 100px 0;
  border-top: 1px solid var(--border);
  position: relative;
}
.jiku-landing .stats::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  width: 600px;
  height: 300px;
  background: radial-gradient(ellipse, rgba(74,222,128,0.03), transparent 65%);
  pointer-events: none;
}
.jiku-landing .stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  position: relative;
  z-index: 2;
}
.jiku-landing .stat-card { text-align: center; padding: 40px 16px; }
.jiku-landing .stat-num {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--jade);
  line-height: 1;
  margin-bottom: 8px;
}
.jiku-landing .stat-label { font-size: 0.85rem; color: var(--text-secondary); }

/* ═══ PRICING ═══ */
.jiku-landing .pricing {
  padding: 120px 0;
  border-top: 1px solid var(--border);
}
.jiku-landing .pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 64px;
}
.jiku-landing .price-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 40px 28px;
  position: relative;
  transition: all 0.4s;
}
.jiku-landing .price-card.featured {
  border-color: var(--jade);
  box-shadow: 0 0 80px rgba(74,222,128,0.06);
}
.jiku-landing .price-card.featured::before {
  content: 'Recomendado';
  position: absolute;
  top: -11px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--jade);
  color: var(--bg);
  font-size: 0.68rem;
  font-weight: 700;
  padding: 4px 16px;
  border-radius: 100px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.jiku-landing .price-tier {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  font-weight: 700;
  margin-bottom: 16px;
}
.jiku-landing .price-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 6px;
}
.jiku-landing .price-sign { font-size: 1.1rem; font-weight: 700; color: var(--text-secondary); }
.jiku-landing .price-val { font-size: 3rem; font-weight: 800; letter-spacing: -0.04em; }
.jiku-landing .price-period { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 6px; }
.jiku-landing .price-desc { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 28px; line-height: 1.5; }
.jiku-landing .price-list { list-style: none; margin-bottom: 28px; padding: 0; }
.jiku-landing .price-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}
.jiku-landing .price-list li:last-child { border-bottom: none; }
.jiku-landing .price-check { color: var(--jade); font-weight: 700; }
.jiku-landing .price-card .btn {
  width: 100%;
  justify-content: center;
  padding: 14px;
}

/* ═══ TESTIMONIALS ═══ */
.jiku-landing .testimonials {
  padding: 120px 0;
  border-top: 1px solid var(--border);
}
.jiku-landing .testi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 64px;
}
.jiku-landing .testi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 32px 28px;
}
.jiku-landing .testi-stars {
  color: var(--gold);
  font-size: 0.85rem;
  letter-spacing: 2px;
  margin-bottom: 16px;
}
.jiku-landing .testi-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.1rem;
  font-style: italic;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 24px;
}
.jiku-landing .testi-author {
  display: flex;
  align-items: center;
  gap: 12px;
}
.jiku-landing .testi-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--bg);
}
.jiku-landing .testi-name { font-weight: 700; font-size: 0.85rem; }
.jiku-landing .testi-role { font-size: 0.72rem; color: var(--text-muted); }

/* ═══ CTA ═══ */
.jiku-landing .cta {
  padding: 140px 0;
  border-top: 1px solid var(--border);
  position: relative;
  overflow: hidden;
  text-align: center;
}
.jiku-landing .cta-axis {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  width: 500px;
  height: 500px;
  border: 1px solid rgba(74,222,128,0.03);
  border-radius: 50%;
  pointer-events: none;
}
.jiku-landing .cta-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  width: 400px;
  height: 300px;
  background: radial-gradient(ellipse, rgba(74,222,128,0.05), transparent 65%);
  pointer-events: none;
  filter: blur(40px);
}
.jiku-landing .cta-content {
  position: relative;
  z-index: 2;
}
.jiku-landing .cta h2 {
  font-size: clamp(2.5rem, 5vw, 3.8rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin-bottom: 20px;
}
.jiku-landing .cta h2 em {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  color: var(--jade);
}
.jiku-landing .cta p {
  font-size: 1.05rem;
  color: var(--text-secondary);
  max-width: 460px;
  margin: 0 auto 36px;
  line-height: 1.6;
}
.jiku-landing .cta .btn-jade { padding: 16px 40px; font-size: 1rem; }
.jiku-landing .cta-note {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 16px;
}

/* ═══ FOOTER ═══ */
.jiku-landing .jiku-footer {
  border-top: 1px solid var(--border);
  padding: 60px 0 36px;
}
.jiku-landing .footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 48px;
}
.jiku-landing .footer-brand-desc {
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-top: 12px;
  max-width: 260px;
}
.jiku-landing .footer-col h4 {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  font-weight: 700;
  margin-bottom: 16px;
}
.jiku-landing .footer-col a {
  display: block;
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 4px 0;
  transition: color 0.3s;
}
.jiku-landing .footer-col a:hover { color: var(--text); }
.jiku-landing .footer-bottom {
  border-top: 1px solid var(--border);
  padding-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ═══ MOBILE NAV ═══ */
.jiku-landing .nav-hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  z-index: 1001;
}
.jiku-landing .nav-hamburger span {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--text);
  border-radius: 2px;
  transition: all 0.3s;
}
.jiku-landing .nav-hamburger.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.jiku-landing .nav-hamburger.open span:nth-child(2) {
  opacity: 0;
}
.jiku-landing .nav-hamburger.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}
.jiku-landing .nav-mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
}
.jiku-landing .nav-mobile-menu {
  position: absolute;
  top: 0;
  right: 0;
  width: 280px;
  height: 100%;
  background: var(--bg);
  border-left: 1px solid var(--border);
  padding: 80px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: slideIn 0.3s cubic-bezier(0.16,1,0.3,1);
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
.jiku-landing .nav-mobile-menu a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  transition: color 0.3s;
}
.jiku-landing .nav-mobile-menu a:hover { color: var(--text); }
.jiku-landing .nav-mobile-menu .btn {
  margin-top: 16px;
  justify-content: center;
}

/* ═══ RESPONSIVE ═══ */
@media (max-width: 968px) {
  .jiku-landing .hero-content { grid-template-columns: 1fr; text-align: center; }
  .jiku-landing .hero-left { display: flex; flex-direction: column; align-items: center; }
  .jiku-landing .hero-ctas { justify-content: center; }
  .jiku-landing .hero-metrics { justify-content: center; }
  .jiku-landing .hero-right { margin-top: 40px; }
  .jiku-landing .phone { transform: none; }
  .jiku-landing .phone:hover { transform: none; }
  .jiku-landing .features-grid,
  .jiku-landing .pricing-grid,
  .jiku-landing .testi-grid { grid-template-columns: 1fr; }
  .jiku-landing .big-feature-grid { grid-template-columns: 1fr; gap: 40px; }
  .jiku-landing .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .jiku-landing .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
  .jiku-landing .nav-links { display: none; }
  .jiku-landing .nav-hamburger { display: flex; }
}
@media (max-width: 600px) {
  .jiku-landing .hero-metrics { flex-direction: column; gap: 16px; }
  .jiku-landing .stats-grid { grid-template-columns: 1fr; }
  .jiku-landing .footer-grid { grid-template-columns: 1fr; }
}
`;
