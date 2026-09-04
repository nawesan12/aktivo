"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "@/lib/animations/gsap";
import { JikuLogo } from "@/components/brand/jiku-logo";

const TOTAL_SLIDES = 9;

/* ── Animated counter hook ── */
function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2,
  active,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  active: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (!active || animated.current || !ref.current) return;
    animated.current = true;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) {
          const v = target % 1 !== 0 ? obj.val.toFixed(1) : Math.round(obj.val).toString();
          ref.current.textContent = prefix + v + suffix;
        }
      },
    });
  }, [active, target, suffix, prefix, duration]);

  // Reset when slide becomes inactive
  useEffect(() => {
    if (!active) animated.current = false;
  }, [active]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

/* ── Floating particles canvas ── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      pulse: number;
    }[] = [];
    const PARTICLE_COUNT = 60;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.015;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const glow = Math.sin(p.pulse) * 0.15 + 0.85;
        ctx.globalAlpha = p.opacity * glow;
        ctx.fillStyle = "#4ADE80";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - p.x;
          const dy = particles[j].y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.globalAlpha = (1 - dist / 120) * 0.06;
            ctx.strokeStyle = "#4ADE80";
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

export default function PresentacionPage() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef(0);
  const slidesRef = useRef<(HTMLDivElement | null)[]>([]);
  const prevSlide = useRef(0);

  /* ── Animate slide transitions with GSAP ── */
  const animateSlide = useCallback(
    (from: number, to: number) => {
      const leaving = slidesRef.current[from];
      const entering = slidesRef.current[to];
      if (!leaving || !entering) return;

      const dir = to > from ? 1 : -1;
      const tl = gsap.timeline({
        onComplete: () => setIsAnimating(false),
      });

      // Exit current slide
      tl.to(leaving, {
        opacity: 0,
        x: -80 * dir,
        scale: 0.95,
        filter: "blur(8px)",
        duration: 0.5,
        ease: "power3.in",
      });

      // Enter new slide
      tl.fromTo(
        entering,
        {
          opacity: 0,
          x: 120 * dir,
          scale: 1.02,
          filter: "blur(12px)",
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.7,
          ease: "power3.out",
        },
        "-=0.2"
      );

      // Stagger child elements in new slide
      const children = entering.querySelectorAll(".anim-in");
      if (children.length) {
        tl.fromTo(
          children,
          { opacity: 0, y: 40, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.08,
          },
          "-=0.4"
        );
      }

      // Animate mockups with 3D entrance
      const mockups = entering.querySelectorAll(".anim-mockup");
      if (mockups.length) {
        tl.fromTo(
          mockups,
          {
            opacity: 0,
            y: 60,
            rotateY: -15,
            rotateX: 5,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            rotateY: 0,
            rotateX: 0,
            scale: 1,
            duration: 1,
            ease: "power3.out",
          },
          "-=0.6"
        );
      }

      // Animate stat numbers with scale pop
      const stats = entering.querySelectorAll(".anim-stat");
      if (stats.length) {
        tl.fromTo(
          stats,
          { opacity: 0, scale: 0.5, y: 30 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.7,
            ease: "back.out(1.7)",
            stagger: 0.12,
          },
          "-=0.5"
        );
      }

      // Animate cards with stagger
      const cards = entering.querySelectorAll(".anim-card");
      if (cards.length) {
        tl.fromTo(
          cards,
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.1,
          },
          "-=0.5"
        );
      }
    },
    []
  );

  /* ── Initial cover animation ── */
  useEffect(() => {
    const cover = slidesRef.current[0];
    if (!cover) return;

    gsap.set(cover, { opacity: 1 });

    const tl = gsap.timeline({ delay: 0.3 });

    tl.fromTo(
      cover.querySelector(".cover-kanji"),
      { opacity: 0, scale: 0.7, rotate: -10 },
      { opacity: 1, scale: 1, rotate: 0, duration: 1.5, ease: "power3.out" }
    );

    tl.fromTo(
      cover.querySelector(".cover-glow"),
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 2, ease: "power2.out" },
      "-=1.2"
    );

    tl.fromTo(
      cover.querySelector(".deck-jiku-logo"),
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
      "-=1.5"
    );

    tl.fromTo(
      cover.querySelector("h1"),
      { opacity: 0, y: 60, clipPath: "inset(100% 0 0 0)" },
      {
        opacity: 1,
        y: 0,
        clipPath: "inset(0% 0 0 0)",
        duration: 1,
        ease: "power3.out",
      },
      "-=1"
    );

    tl.fromTo(
      cover.querySelector(".cover-sub"),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
      "-=0.6"
    );

    const tags = cover.querySelectorAll(".cover-tags span");
    tl.fromTo(
      tags,
      { opacity: 0, scale: 0.8, y: 20 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.5,
        ease: "back.out(1.5)",
        stagger: 0.07,
      },
      "-=0.4"
    );

    tl.fromTo(
      cover.querySelector(".cover-hint"),
      { opacity: 0 },
      { opacity: 1, duration: 0.5 },
      "-=0.2"
    );
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating || index === current || index < 0 || index >= TOTAL_SLIDES) return;
      setIsAnimating(true);
      prevSlide.current = current;
      setCurrent(index);
      animateSlide(current, index);
    },
    [current, isAnimating, animateSlide]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) diff > 0 ? next() : prev();
  };

  const setSlideRef = (index: number) => (el: HTMLDivElement | null) => {
    slidesRef.current[index] = el;
  };

  return (
    <div
      className="jiku-deck"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style dangerouslySetInnerHTML={{ __html: deckStyles }} />

      <ParticleField />

      {/* Animated gradient mesh background */}
      <div className="deck-mesh" />

      {/* Progress bar */}
      <div className="deck-progress">
        <div
          className="deck-progress-fill"
          style={{ width: `${((current + 1) / TOTAL_SLIDES) * 100}%` }}
        />
      </div>

      {/* Nav dots */}
      <div className="deck-dots">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button
            key={i}
            className={`deck-dot ${i === current ? "active" : ""} ${i < current ? "past" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="deck-counter mono">
        <span className="deck-counter-current">{String(current + 1).padStart(2, "0")}</span>
        <span className="deck-counter-sep">/</span>
        <span>{String(TOTAL_SLIDES).padStart(2, "0")}</span>
      </div>

      {/* Logo */}
      <div className="deck-logo">
        <JikuLogo size="sm" />
      </div>

      {/* Arrow buttons with pulse ring on hover */}
      <button className="deck-arrow deck-arrow-left" onClick={prev} disabled={current === 0} aria-label="Anterior">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <button className="deck-arrow deck-arrow-right" onClick={next} disabled={current === TOTAL_SLIDES - 1} aria-label="Siguiente">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
      </button>

      {/* ═══ SLIDE 0: COVER ═══ */}
      <div ref={setSlideRef(0)} className="deck-slide" style={{ opacity: current === 0 ? 1 : 0, pointerEvents: current === 0 ? "auto" : "none" }}>
        <div className="slide-cover">
          <div className="cover-axis" />
          <div className="cover-axis cover-axis-2" />
          <div className="cover-glow" />
          <div className="cover-glow cover-glow-2" />
          <div className="cover-kanji serif">&#36600;</div>
          <div className="cover-content">
            <div className="deck-jiku-logo">
              <JikuLogo size="xl" animated />
            </div>
            <h1>
              El <em className="serif jade">eje</em> de
              <br />
              tu negocio
            </h1>
            <p className="cover-sub">
              Plataforma integral de gesti&oacute;n para negocios de servicios
            </p>
            <div className="cover-tags mono">
              <span>Turnos 24/7</span>
              <span>WhatsApp</span>
              <span>Cobros</span>
              <span>CRM</span>
              <span>Analytics</span>
            </div>
          </div>
          <div className="cover-hint mono">
            Presion&aacute; <span className="jade">&rarr;</span> o desliz&aacute; para avanzar
          </div>
        </div>
      </div>

      {/* ═══ SLIDE 1: PROBLEM ═══ */}
      <div ref={setSlideRef(1)} className="deck-slide" style={{ opacity: 0, pointerEvents: current === 1 ? "auto" : "none" }}>
        <div className="slide-problem">
          <div className="problem-glow" />
          <div className="problem-glow problem-glow-2" />
          <div className="slide-eyebrow mono anim-in">01 &mdash; EL PROBLEMA</div>
          <h2 className="anim-in">
            Tu negocio pierde plata
            <br />
            <span className="coral">todos los d&iacute;as</span>
          </h2>
          <div className="problem-grid">
            <div className="problem-card anim-card">
              <div className="problem-icon">&#128242;</div>
              <div className="problem-stat coral anim-stat">
                <AnimatedCounter target={8} active={current === 1} /> de cada 10
              </div>
              <div className="problem-desc">
                clientes prefieren reservar online, pero la mayor&iacute;a de los negocios
                todav&iacute;a usan WhatsApp manual o libreta
              </div>
            </div>
            <div className="problem-card anim-card">
              <div className="problem-icon">&#128683;</div>
              <div className="problem-stat coral anim-stat">
                <AnimatedCounter target={30} suffix="%" active={current === 1} />
              </div>
              <div className="problem-desc">
                de los turnos no se presentan cuando no hay recordatorios
                autom&aacute;ticos ni se&ntilde;as
              </div>
            </div>
            <div className="problem-card anim-card">
              <div className="problem-icon">&#9203;</div>
              <div className="problem-stat coral anim-stat">
                <AnimatedCounter target={15} prefix="+" suffix="h" active={current === 1} />/semana
              </div>
              <div className="problem-desc">
                perdidas gestionando turnos, respondiendo mensajes y
                organizando la agenda a mano
              </div>
            </div>
            <div className="problem-card anim-card">
              <div className="problem-icon">&#128200;</div>
              <div className="problem-stat coral anim-stat">$0 datos</div>
              <div className="problem-desc">
                Sin CRM no sab&eacute;s qui&eacute;n es tu mejor cliente, qu&eacute;
                servicio rinde m&aacute;s ni cu&aacute;ndo es tu mejor horario
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SLIDE 2: SOLUTION ═══ */}
      <div ref={setSlideRef(2)} className="deck-slide" style={{ opacity: 0, pointerEvents: current === 2 ? "auto" : "none" }}>
        <div className="slide-solution">
          <div className="solution-glow" />
          <div className="slide-eyebrow mono anim-in">02 &mdash; LA SOLUCI&Oacute;N</div>
          <h2 className="anim-in">
            Un solo <em className="serif jade">eje</em>.
            <br />
            Todo conectado.
          </h2>
          <p className="solution-desc anim-in">
            Jiku centraliza tu agenda, clientes, pagos, marketing y
            analytics en una sola plataforma. Todo gira alrededor de tu
            negocio.
          </p>
          <div className="solution-orbit anim-mockup">
            <div className="orbit-center">
              <div className="orbit-center-inner">
                <span className="serif" style={{ fontSize: "2rem" }}>&#36600;</span>
                <span style={{ fontSize: "0.7rem", marginTop: 4 }}>TU NEGOCIO</span>
              </div>
            </div>
            <div className="orbit-ring ring-1">
              <div className="orbit-item" style={{ top: "0%", left: "50%", transform: "translate(-50%, -50%)" }}>
                <div className="orbit-node jade-bg">&#128197;</div>
                <span>Agenda</span>
              </div>
              <div className="orbit-item" style={{ top: "50%", right: "0%", transform: "translate(50%, -50%)" }}>
                <div className="orbit-node jade-bg">&#128172;</div>
                <span>WhatsApp</span>
              </div>
              <div className="orbit-item" style={{ bottom: "0%", left: "50%", transform: "translate(-50%, 50%)" }}>
                <div className="orbit-node jade-bg">&#128179;</div>
                <span>Cobros</span>
              </div>
              <div className="orbit-item" style={{ top: "50%", left: "0%", transform: "translate(-50%, -50%)" }}>
                <div className="orbit-node jade-bg">&#128101;</div>
                <span>CRM</span>
              </div>
            </div>
            <div className="orbit-ring ring-2">
              <div className="orbit-item" style={{ top: "10%", right: "10%", transform: "translate(50%, -50%)" }}>
                <div className="orbit-node dim-bg">&#128202;</div>
                <span>Analytics</span>
              </div>
              <div className="orbit-item" style={{ bottom: "10%", right: "10%", transform: "translate(50%, 50%)" }}>
                <div className="orbit-node dim-bg">&#127873;</div>
                <span>Fidelidad</span>
              </div>
              <div className="orbit-item" style={{ bottom: "10%", left: "10%", transform: "translate(-50%, 50%)" }}>
                <div className="orbit-node dim-bg">&#128227;</div>
                <span>Campa&ntilde;as</span>
              </div>
              <div className="orbit-item" style={{ top: "10%", left: "10%", transform: "translate(-50%, -50%)" }}>
                <div className="orbit-node dim-bg">&#11088;</div>
                <span>Rese&ntilde;as</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SLIDE 3: AGENDA ═══ */}
      <div ref={setSlideRef(3)} className="deck-slide" style={{ opacity: 0, pointerEvents: current === 3 ? "auto" : "none" }}>
        <div className="slide-feature">
          <div className="slide-eyebrow mono anim-in">03 &mdash; AGENDA INTELIGENTE</div>
          <div className="feature-split">
            <div className="feature-text">
              <h2 className="anim-in">
                Reservas <span className="jade">24/7</span>
                <br />
                sin levantar
                <br />
                el tel&eacute;fono
              </h2>
              <ul className="feature-list">
                <li className="anim-in"><span className="jade">&#10003;</span> Link de reservas propio con tu marca</li>
                <li className="anim-in"><span className="jade">&#10003;</span> Selecci&oacute;n de servicio, profesional y horario</li>
                <li className="anim-in"><span className="jade">&#10003;</span> Disponibilidad en tiempo real</li>
                <li className="anim-in"><span className="jade">&#10003;</span> Se&ntilde;as y pagos al reservar</li>
                <li className="anim-in"><span className="jade">&#10003;</span> Widget embebible para tu web</li>
              </ul>
            </div>
            <div className="feature-visual">
              <div className="phone-mock anim-mockup">
                <div className="phone-mock-glow" />
                <div className="phone-mock-notch" />
                <div className="phone-mock-screen">
                  <div className="mock-bk-header">
                    <div className="mock-bk-avatar jade-bg">SB</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Studio Bella</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Reserv&aacute; tu turno</div>
                    </div>
                  </div>
                  <div className="mock-bk-label">Eleg&iacute; un servicio</div>
                  <div className="mock-bk-service selected">
                    <span>&#128135;&#8205;&#9792;&#65039; Corte + Brushing</span>
                    <span className="mock-bk-price">$8.500</span>
                  </div>
                  <div className="mock-bk-service">
                    <span>&#128133; Manicura Semipermanente</span>
                    <span className="mock-bk-price">$6.200</span>
                  </div>
                  <div className="mock-bk-service">
                    <span>&#128134; Color completo</span>
                    <span className="mock-bk-price">$15.000</span>
                  </div>
                  <div className="mock-bk-label" style={{ marginTop: 16 }}>Horarios disponibles</div>
                  <div className="mock-bk-slots">
                    <span className="mock-slot">09:00</span>
                    <span className="mock-slot selected">10:30</span>
                    <span className="mock-slot">11:00</span>
                    <span className="mock-slot">14:00</span>
                    <span className="mock-slot">16:30</span>
                  </div>
                  <button className="mock-bk-btn">Confirmar turno &rarr;</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SLIDE 4: WHATSAPP ═══ */}
      <div ref={setSlideRef(4)} className="deck-slide" style={{ opacity: 0, pointerEvents: current === 4 ? "auto" : "none" }}>
        <div className="slide-feature">
          <div className="slide-eyebrow mono anim-in">04 &mdash; WHATSAPP AUTOM&Aacute;TICO</div>
          <div className="feature-split reverse">
            <div className="feature-visual">
              <div className="wa-mock anim-mockup">
                <div className="wa-mock-header">
                  <div className="wa-mock-back">&#8592;</div>
                  <div className="wa-mock-avatar jade-bg">J</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Jiku Bot</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>en l&iacute;nea</div>
                  </div>
                </div>
                <div className="wa-mock-body">
                  <div className="wa-mock-msg wa-anim-1">
                    <strong>&#128075; &iexcl;Hola Luc&iacute;a!</strong>
                    <br />
                    Te recordamos tu turno <strong>ma&ntilde;ana a las 10:00</strong> con Mart&iacute;n.
                    <br /><br />
                    &#128137; Servicio: Corte + Color
                    <br />
                    &#128205; Av. Santa Fe 2431
                    <br /><br />
                    &#9989; <span className="jade">Confirmar</span> &nbsp; &#10060; Cancelar
                    <div className="wa-mock-time">14:30 &#10003;&#10003;</div>
                  </div>
                  <div className="wa-mock-msg reply wa-anim-2">
                    Confirmo! &#128588;
                    <div className="wa-mock-time">14:32 &#10003;&#10003;</div>
                  </div>
                  <div className="wa-mock-msg wa-anim-3">
                    <strong>&#10024; &iexcl;Turno confirmado!</strong>
                    <br />
                    Te esperamos ma&ntilde;ana. Lleg&aacute; 5 min antes.
                    <br /><br />
                    &iquest;Quer&eacute;s agregar al calendario? &#128197;
                    <div className="wa-mock-time">14:32 &#10003;&#10003;</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-text">
              <h2 className="anim-in">
                El <span className="jade">98%</span> de tus
                <br />
                clientes usa
                <br />
                WhatsApp
              </h2>
              <ul className="feature-list">
                <li className="anim-in"><span className="jade">&#10003;</span> Confirmaciones autom&aacute;ticas al reservar</li>
                <li className="anim-in"><span className="jade">&#10003;</span> Recordatorios 24h antes del turno</li>
                <li className="anim-in"><span className="jade">&#10003;</span> Seguimiento post-servicio</li>
                <li className="anim-in"><span className="jade">&#10003;</span> Pedido de rese&ntilde;as autom&aacute;tico</li>
                <li className="anim-in"><span className="jade">&#10003;</span> Campa&ntilde;as de marketing segmentadas</li>
              </ul>
              <div className="feature-stat-row">
                <div className="anim-stat">
                  <div className="feature-stat-num jade">
                    <AnimatedCounter target={73} prefix="-" suffix="%" active={current === 4} />
                  </div>
                  <div className="feature-stat-label">ausencias</div>
                </div>
                <div className="anim-stat">
                  <div className="feature-stat-num jade">
                    <AnimatedCounter target={45} prefix="+" suffix="%" active={current === 4} />
                  </div>
                  <div className="feature-stat-label">rese&ntilde;as</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SLIDE 5: CRM ═══ */}
      <div ref={setSlideRef(5)} className="deck-slide" style={{ opacity: 0, pointerEvents: current === 5 ? "auto" : "none" }}>
        <div className="slide-feature">
          <div className="slide-eyebrow mono anim-in">05 &mdash; CRM &amp; ANALYTICS</div>
          <div className="feature-split">
            <div className="feature-text">
              <h2 className="anim-in">
                Conoc&eacute; a tus
                <br />
                clientes.
                <br />
                <span className="jade">Crec&eacute;.</span>
              </h2>
              <ul className="feature-list">
                <li className="anim-in"><span className="jade">&#10003;</span> Historial completo de cada cliente</li>
                <li className="anim-in"><span className="jade">&#10003;</span> Tags y segmentaci&oacute;n inteligente</li>
                <li className="anim-in"><span className="jade">&#10003;</span> Reportes de facturaci&oacute;n en tiempo real</li>
                <li className="anim-in"><span className="jade">&#10003;</span> Heatmap de horarios pico</li>
                <li className="anim-in"><span className="jade">&#10003;</span> Retenci&oacute;n, churn y LTV por cliente</li>
              </ul>
            </div>
            <div className="feature-visual">
              <div className="dashboard-mock anim-mockup">
                <div className="dash-topbar">
                  <div className="dash-tab active">Resumen</div>
                  <div className="dash-tab">Clientes</div>
                  <div className="dash-tab">Reportes</div>
                </div>
                <div className="dash-kpis">
                  <div className="dash-kpi">
                    <div className="dash-kpi-label">Turnos hoy</div>
                    <div className="dash-kpi-val jade">
                      <AnimatedCounter target={24} active={current === 5} />
                    </div>
                  </div>
                  <div className="dash-kpi">
                    <div className="dash-kpi-label">Facturado / mes</div>
                    <div className="dash-kpi-val gold">
                      $<AnimatedCounter target={1.2} suffix="M" active={current === 5} />
                    </div>
                  </div>
                  <div className="dash-kpi">
                    <div className="dash-kpi-label">Retenci&oacute;n</div>
                    <div className="dash-kpi-val jade">
                      <AnimatedCounter target={87} suffix="%" active={current === 5} />
                    </div>
                  </div>
                </div>
                <div className="dash-chart">
                  <div className="dash-chart-title">Ingresos &uacute;ltimos 7 d&iacute;as</div>
                  <div className="dash-bars">
                    <div className="dash-bar" style={{ height: "55%" }}><span>L</span></div>
                    <div className="dash-bar" style={{ height: "70%" }}><span>M</span></div>
                    <div className="dash-bar" style={{ height: "85%" }}><span>X</span></div>
                    <div className="dash-bar" style={{ height: "60%" }}><span>J</span></div>
                    <div className="dash-bar high" style={{ height: "100%" }}><span>V</span></div>
                    <div className="dash-bar" style={{ height: "90%" }}><span>S</span></div>
                    <div className="dash-bar" style={{ height: "30%" }}><span>D</span></div>
                  </div>
                </div>
                <div className="dash-clients">
                  <div className="dash-client-row">
                    <div className="dash-cl-avatar" style={{ background: "linear-gradient(135deg, #4ADE80, #22c55e)" }}>LF</div>
                    <div className="dash-cl-info">
                      <div>Luc&iacute;a Fern&aacute;ndez</div>
                      <div className="dash-cl-sub">12 visitas &middot; VIP</div>
                    </div>
                    <div className="dash-cl-spent">$98.400</div>
                  </div>
                  <div className="dash-client-row">
                    <div className="dash-cl-avatar" style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}>ML</div>
                    <div className="dash-cl-info">
                      <div>Mat&iacute;as L&oacute;pez</div>
                      <div className="dash-cl-sub">8 visitas &middot; Regular</div>
                    </div>
                    <div className="dash-cl-spent">$52.000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SLIDE 6: STATS ═══ */}
      <div ref={setSlideRef(6)} className="deck-slide" style={{ opacity: 0, pointerEvents: current === 6 ? "auto" : "none" }}>
        <div className="slide-stats">
          <div className="stats-glow" />
          <div className="slide-eyebrow mono anim-in">06 &mdash; RESULTADOS REALES</div>
          <h2 className="anim-in">
            N&uacute;meros que
            <br />
            <span className="jade">hablan solos</span>
          </h2>
          <div className="stats-mega-grid">
            <div className="stat-mega-card anim-card">
              <div className="stat-mega-num anim-stat">
                <AnimatedCounter target={73} suffix="%" active={current === 6} duration={2.5} />
              </div>
              <div className="stat-mega-label">Menos ausencias</div>
              <div className="stat-mega-desc">
                Gracias a recordatorios autom&aacute;ticos por WhatsApp y se&ntilde;as al reservar
              </div>
              <div className="stat-mega-bar"><div className="stat-mega-bar-fill" style={{ width: "73%" }} /></div>
            </div>
            <div className="stat-mega-card anim-card">
              <div className="stat-mega-num anim-stat">
                <AnimatedCounter target={2.4} suffix="x" active={current === 6} duration={2} />
              </div>
              <div className="stat-mega-label">M&aacute;s reservas online</div>
              <div className="stat-mega-desc">
                Clientes que reservan solos a cualquier hora del d&iacute;a
              </div>
              <div className="stat-mega-bar"><div className="stat-mega-bar-fill" style={{ width: "85%" }} /></div>
            </div>
            <div className="stat-mega-card anim-card">
              <div className="stat-mega-num anim-stat">
                <AnimatedCounter target={15} suffix="h" active={current === 6} duration={2} />
              </div>
              <div className="stat-mega-label">Ahorradas por semana</div>
              <div className="stat-mega-desc">
                Tiempo que antes se iba en gestionar la agenda manualmente
              </div>
              <div className="stat-mega-bar"><div className="stat-mega-bar-fill" style={{ width: "60%" }} /></div>
            </div>
            <div className="stat-mega-card anim-card">
              <div className="stat-mega-num anim-stat">
                <AnimatedCounter target={45} prefix="+" suffix="%" active={current === 6} duration={2.5} />
              </div>
              <div className="stat-mega-label">Facturaci&oacute;n</div>
              <div className="stat-mega-desc">
                Aumento promedio en 3 meses con CRM y campa&ntilde;as autom&aacute;ticas
              </div>
              <div className="stat-mega-bar"><div className="stat-mega-bar-fill" style={{ width: "45%" }} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SLIDE 7: PRICING ═══ */}
      <div ref={setSlideRef(7)} className="deck-slide" style={{ opacity: 0, pointerEvents: current === 7 ? "auto" : "none" }}>
        <div className="slide-pricing">
          <div className="slide-eyebrow mono anim-in">07 &mdash; PLANES</div>
          <h2 className="anim-in">
            Simple. Transparente.
            <br />
            <span className="jade">Sin letra chica.</span>
          </h2>
          <div className="pricing-cards">
            <div className="pricing-card featured anim-card">
              <div className="pc-badge">M&aacute;s elegido</div>
              <div className="pc-tier">Inicial</div>
              <div className="pc-price">
                <span className="pc-currency">$</span>
                <span className="pc-amount">7.000</span>
                <span className="pc-mo">/mes</span>
              </div>
              <div className="pc-period">ARS &middot; Facturaci&oacute;n mensual</div>
              <ul className="pc-features">
                <li>&#10003; Hasta 3 profesionales</li>
                <li>&#10003; Turnos ilimitados</li>
                <li>&#10003; Cobros con Mercado Pago</li>
                <li>&#10003; CRM + fidelizaci&oacute;n</li>
                <li>&#10003; Reportes avanzados</li>
              </ul>
            </div>
            <div className="pricing-card anim-card">
              <div className="pc-tier">Completo</div>
              <div className="pc-price">
                <span className="pc-currency">$</span>
                <span className="pc-amount">15.000</span>
                <span className="pc-mo">/mes</span>
              </div>
              <div className="pc-period">ARS &middot; Facturaci&oacute;n mensual</div>
              <ul className="pc-features">
                <li>&#10003; Todo lo del plan Inicial</li>
                <li>&#10003; Profesionales ilimitados</li>
                <li>&#10003; Multi-sucursal</li>
                <li>&#10003; Marca blanca</li>
                <li>&#10003; Soporte prioritario</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SLIDE 8: CLOSE ═══ */}
      <div ref={setSlideRef(8)} className="deck-slide" style={{ opacity: 0, pointerEvents: current === 8 ? "auto" : "none" }}>
        <div className="slide-close">
          <div className="close-axis" />
          <div className="close-axis close-axis-2" />
          <div className="close-glow" />
          <div className="close-glow close-glow-2" />
          <div className="close-kanji serif">&#36600;</div>
          <div className="close-content">
            <div className="slide-eyebrow mono anim-in" style={{ marginBottom: 24 }}>08 &mdash; EMPECEMOS</div>
            <h2 className="anim-in">
              Todo gira alrededor
              <br />
              de un <em className="serif jade">eje</em>
            </h2>
            <p className="close-desc anim-in">
              Configur&aacute; tu cuenta en menos de 5 minutos.
              <br />
              Sin tarjeta. Sin compromiso. Sin letra chica.
            </p>
            <div className="close-steps">
              <div className="close-step anim-card">
                <div className="close-step-num jade-bg mono">1</div>
                <div>
                  <strong>Cre&aacute; tu cuenta</strong>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Email o Google, 30 segundos</div>
                </div>
              </div>
              <div className="close-step anim-card">
                <div className="close-step-num jade-bg mono">2</div>
                <div>
                  <strong>Configur&aacute; tu negocio</strong>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Servicios, equipo y horarios</div>
                </div>
              </div>
              <div className="close-step anim-card">
                <div className="close-step-num jade-bg mono">3</div>
                <div>
                  <strong>Compart&iacute; tu link</strong>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tus clientes ya pueden reservar</div>
                </div>
              </div>
            </div>
            <div className="close-url anim-in">
              <span className="mono" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>jikuapp.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SCOPED CSS — cinematic presentation deck
   ════════════════════════════════════════════════════════════════ */
const deckStyles = `
/* ═══ ROOT ═══ */
.jiku-deck {
  --bg: #050507;
  --surface: #0f0f15;
  --surface-2: #16161e;
  --surface-3: #1c1c26;
  --border: rgba(255,255,255,0.06);
  --text: #eeedf2;
  --text-secondary: #a09cae;
  --text-muted: #5c5872;
  --jade: #4ADE80;
  --jade-dim: rgba(74,222,128,0.08);
  --jade-glow: rgba(74,222,128,0.15);
  --jade-deep: #22c55e;
  --gold: #fbbf24;
  --coral: #fb7185;

  position: fixed;
  inset: 0;
  background: var(--bg);
  color: var(--text);
  font-family: 'Sora', sans-serif;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  user-select: none;
}
.jiku-deck .serif { font-family: 'Cormorant Garamond', serif; }
.jiku-deck .mono { font-family: 'IBM Plex Mono', monospace; }
.jiku-deck .jade { color: var(--jade); }
.jiku-deck .coral { color: var(--coral); }
.jiku-deck .gold { color: var(--gold); }

/* Grain overlay */
.jiku-deck::after {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.018;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 10000;
}

/* Animated gradient mesh */
.deck-mesh {
  position: fixed;
  inset: 0;
  z-index: 0;
  opacity: 0.4;
  background:
    radial-gradient(ellipse 600px 400px at 20% 50%, rgba(74,222,128,0.04), transparent),
    radial-gradient(ellipse 500px 500px at 80% 20%, rgba(34,197,94,0.03), transparent),
    radial-gradient(ellipse 400px 600px at 60% 80%, rgba(74,222,128,0.025), transparent);
  animation: meshDrift 20s ease-in-out infinite alternate;
  pointer-events: none;
}
@keyframes meshDrift {
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.02); }
  66% { transform: translate(-20px, 30px) scale(0.98); }
  100% { transform: translate(10px, -10px) scale(1.01); }
}

/* ═══ PROGRESS BAR ═══ */
.deck-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255,255,255,0.04);
  z-index: 100;
}
.deck-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--jade), var(--jade-deep), var(--jade));
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
  transition: width 0.7s cubic-bezier(0.16,1,0.3,1);
  box-shadow: 0 0 20px var(--jade-glow), 0 0 60px rgba(74,222,128,0.08);
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ═══ DOTS ═══ */
.deck-dots {
  position: fixed;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;
}
.deck-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,0.15);
  background: transparent;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.16,1,0.3,1);
  padding: 0;
  position: relative;
}
.deck-dot::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid transparent;
  transition: all 0.4s;
}
.deck-dot.active {
  background: var(--jade);
  border-color: var(--jade);
  box-shadow: 0 0 16px var(--jade-glow);
  transform: scale(1.4);
}
.deck-dot.active::after {
  border-color: rgba(74,222,128,0.2);
  animation: dotPulse 2s ease-in-out infinite;
}
@keyframes dotPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.6); opacity: 0; }
}
.deck-dot.past {
  background: rgba(74,222,128,0.35);
  border-color: rgba(74,222,128,0.35);
}

/* ═══ COUNTER ═══ */
.deck-counter {
  position: fixed;
  bottom: 28px;
  right: 32px;
  font-size: 0.72rem;
  color: var(--text-muted);
  z-index: 100;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 4px;
}
.deck-counter-current {
  color: var(--jade);
  font-weight: 600;
  font-size: 0.85rem;
}
.deck-counter-sep {
  opacity: 0.3;
  margin: 0 2px;
}

/* ═══ LOGO ═══ */
.deck-logo {
  position: fixed;
  top: 24px;
  left: 32px;
  z-index: 100;
  opacity: 0.7;
  transition: opacity 0.3s;
}
.deck-logo:hover { opacity: 1; }

/* ═══ ARROWS ═══ */
.deck-arrow {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--text-secondary);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
  padding: 0;
  backdrop-filter: blur(8px);
}
.deck-arrow::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1px solid transparent;
  transition: all 0.4s;
}
.deck-arrow:hover:not(:disabled) {
  background: rgba(74,222,128,0.08);
  border-color: rgba(74,222,128,0.3);
  color: var(--jade);
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 0 30px rgba(74,222,128,0.12);
}
.deck-arrow:hover:not(:disabled)::before {
  border-color: rgba(74,222,128,0.15);
}
.deck-arrow:active:not(:disabled) {
  transform: translateY(-50%) scale(0.95);
}
.deck-arrow:disabled {
  opacity: 0.1;
  cursor: default;
}
.deck-arrow-left { left: 24px; }
.deck-arrow-right { right: 72px; }

/* ═══ SLIDES ═══ */
.deck-slide {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 110px;
  will-change: transform, opacity, filter;
  perspective: 1200px;
}

/* ═══ SLIDE EYEBROW ═══ */
.slide-eyebrow {
  font-size: 0.72rem;
  letter-spacing: 0.25em;
  color: var(--jade);
  margin-bottom: 20px;
  font-weight: 500;
  text-transform: uppercase;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.slide-eyebrow::before {
  content: '';
  width: 24px;
  height: 1px;
  background: var(--jade);
  display: inline-block;
}

/* ═══ SLIDE 0: COVER ═══ */
.slide-cover {
  text-align: center;
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.cover-axis {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  width: 650px;
  height: 650px;
  border: 1px solid rgba(74,222,128,0.04);
  border-radius: 50%;
  animation: deckAxisSpin 50s linear infinite;
}
.cover-axis::before {
  content: '';
  position: absolute;
  inset: 60px;
  border: 1px solid rgba(74,222,128,0.03);
  border-radius: 50%;
}
.cover-axis::after {
  content: '';
  position: absolute;
  inset: 140px;
  border: 1px solid rgba(74,222,128,0.025);
  border-radius: 50%;
}
.cover-axis-2 {
  width: 800px;
  height: 800px;
  border-color: rgba(74,222,128,0.02);
  animation-direction: reverse;
  animation-duration: 70s;
}
.cover-axis-2::before { border-color: rgba(74,222,128,0.015); }
.cover-axis-2::after { border-color: rgba(74,222,128,0.01); }

@keyframes deckAxisSpin {
  to { transform: translate(-50%,-50%) rotate(360deg); }
}
.cover-glow {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%,-50%);
  width: 500px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(74,222,128,0.08), transparent 65%);
  pointer-events: none;
  filter: blur(80px);
  animation: glowPulse 6s ease-in-out infinite alternate;
}
.cover-glow-2 {
  width: 300px;
  height: 300px;
  top: 60%;
  background: radial-gradient(ellipse, rgba(34,197,94,0.05), transparent 65%);
  animation-delay: -3s;
  animation-duration: 8s;
}
@keyframes glowPulse {
  0% { opacity: 0.7; transform: translate(-50%,-50%) scale(1); }
  100% { opacity: 1; transform: translate(-50%,-50%) scale(1.15); }
}
.cover-kanji {
  position: absolute;
  font-size: 22rem;
  color: rgba(74,222,128,0.02);
  font-weight: 300;
  pointer-events: none;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  line-height: 1;
  animation: kanjiFloat 12s ease-in-out infinite alternate;
}
@keyframes kanjiFloat {
  0% { transform: translate(-50%,-50%) scale(1) rotate(0deg); }
  100% { transform: translate(-50%,-50%) scale(1.05) rotate(3deg); }
}
.cover-content {
  position: relative;
  z-index: 2;
}
.cover-content h1 {
  font-size: clamp(3rem, 6vw, 5.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-top: 32px;
  margin-bottom: 20px;
}
.cover-content h1 em {
  font-style: italic;
  font-weight: 500;
  font-size: 1.1em;
}
.cover-sub {
  font-size: 1.15rem;
  color: var(--text-secondary);
  margin-bottom: 40px;
  letter-spacing: 0.01em;
}
.cover-tags {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.cover-tags span {
  padding: 7px 18px;
  border-radius: 100px;
  border: 1px solid rgba(74,222,128,0.15);
  background: rgba(74,222,128,0.04);
  font-size: 0.7rem;
  color: var(--jade);
  letter-spacing: 0.04em;
  transition: all 0.4s;
  backdrop-filter: blur(4px);
}
.cover-tags span:hover {
  background: rgba(74,222,128,0.1);
  border-color: rgba(74,222,128,0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(74,222,128,0.1);
}
.cover-hint {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  color: var(--text-muted);
  animation: hintFloat 3s ease-in-out infinite;
}
@keyframes hintFloat {
  0%, 100% { opacity: 0.3; transform: translateX(-50%) translateY(0); }
  50% { opacity: 1; transform: translateX(-50%) translateY(-6px); }
}

/* ═══ SLIDE 1: PROBLEM ═══ */
.slide-problem {
  width: 100%;
  max-width: 1000px;
  position: relative;
}
.problem-glow {
  position: absolute;
  top: -100px;
  right: -100px;
  width: 450px;
  height: 450px;
  background: radial-gradient(ellipse, rgba(251,113,133,0.07), transparent 65%);
  pointer-events: none;
  filter: blur(80px);
  animation: glowPulse 7s ease-in-out infinite alternate;
}
.problem-glow-2 {
  top: auto;
  bottom: -80px;
  left: -80px;
  right: auto;
  width: 350px;
  height: 350px;
  background: radial-gradient(ellipse, rgba(251,113,133,0.04), transparent 65%);
  animation-delay: -3.5s;
}
.slide-problem h2 {
  font-size: clamp(2.2rem, 4.5vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin-bottom: 48px;
}
.problem-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.problem-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 28px;
  transition: all 0.5s cubic-bezier(0.16,1,0.3,1);
  position: relative;
  overflow: hidden;
}
.problem-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(251,113,133,0.2), transparent);
  opacity: 0;
  transition: opacity 0.5s;
}
.problem-card:hover {
  border-color: rgba(251,113,133,0.15);
  transform: translateY(-4px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.problem-card:hover::before { opacity: 1; }
.problem-icon {
  font-size: 1.8rem;
  margin-bottom: 14px;
  filter: grayscale(0.3);
}
.problem-stat {
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 8px;
}
.problem-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ═══ FEATURE SPLIT LAYOUT ═══ */
.slide-feature {
  width: 100%;
  max-width: 1100px;
}
.feature-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
  margin-top: 12px;
}
.feature-split.reverse { direction: rtl; }
.feature-split.reverse > * { direction: ltr; }
.feature-text h2 {
  font-size: clamp(2rem, 3.5vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin-bottom: 28px;
}
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.feature-list li {
  font-size: 0.88rem;
  color: var(--text-secondary);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  line-height: 1.5;
  transition: all 0.3s;
}
.feature-list li:hover {
  color: var(--text);
  transform: translateX(4px);
}
.feature-list li .jade {
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}
.feature-stat-row {
  display: flex;
  gap: 48px;
  margin-top: 36px;
}
.feature-stat-num {
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}
.feature-stat-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 2px;
  letter-spacing: 0.03em;
}

/* ═══ PHONE MOCKUP ═══ */
.phone-mock {
  width: 280px;
  margin: 0 auto;
  background: var(--surface);
  border-radius: 40px;
  border: 1.5px solid rgba(255,255,255,0.08);
  padding: 10px;
  box-shadow:
    0 60px 120px rgba(0,0,0,0.5),
    0 0 0 0.5px rgba(255,255,255,0.04),
    inset 0 1px 0 rgba(255,255,255,0.06);
  transform-style: preserve-3d;
  position: relative;
}
.phone-mock-glow {
  position: absolute;
  inset: -40px;
  background: radial-gradient(ellipse, rgba(74,222,128,0.08), transparent 60%);
  border-radius: 50%;
  filter: blur(40px);
  pointer-events: none;
  animation: glowPulse 5s ease-in-out infinite alternate;
}
.phone-mock-notch {
  width: 100px;
  height: 24px;
  background: var(--bg);
  border-radius: 0 0 16px 16px;
  margin: -10px auto 4px;
  position: relative;
  z-index: 5;
}
.phone-mock-screen {
  background: var(--bg);
  border-radius: 30px;
  padding: 18px 14px;
  min-height: 400px;
}
.mock-bk-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.mock-bk-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.65rem;
  color: var(--bg);
  flex-shrink: 0;
}
.jade-bg { background: linear-gradient(135deg, var(--jade), var(--jade-deep)); }
.dim-bg { background: var(--surface-2); border: 1px solid var(--border); }
.mock-bk-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-bottom: 8px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.mock-bk-service {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--surface);
  margin-bottom: 6px;
  font-size: 0.75rem;
  border: 1px solid transparent;
  transition: all 0.3s;
}
.mock-bk-service.selected {
  border-color: var(--jade);
  background: rgba(74,222,128,0.06);
  box-shadow: 0 0 20px rgba(74,222,128,0.06);
}
.mock-bk-price { color: var(--jade); font-weight: 600; font-size: 0.72rem; }
.mock-bk-slots { display: flex; gap: 6px; flex-wrap: wrap; }
.mock-slot {
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--surface);
  font-size: 0.7rem;
  font-family: 'IBM Plex Mono', monospace;
  border: 1px solid transparent;
  transition: all 0.3s;
}
.mock-slot.selected {
  border-color: var(--jade);
  background: rgba(74,222,128,0.08);
  color: var(--jade);
  box-shadow: 0 0 12px rgba(74,222,128,0.08);
}
.mock-bk-btn {
  width: 100%;
  margin-top: 16px;
  padding: 11px;
  border-radius: 12px;
  background: var(--jade);
  color: var(--bg);
  border: none;
  font-weight: 700;
  font-size: 0.78rem;
  font-family: 'Sora', sans-serif;
  cursor: default;
  box-shadow: 0 4px 20px rgba(74,222,128,0.2);
}

/* ═══ WA MOCKUP ═══ */
.wa-mock {
  width: 300px;
  margin: 0 auto;
  background: #0b141a;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 50px 100px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.03);
  transform-style: preserve-3d;
}
.wa-mock-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #1f2c34;
}
.wa-mock-back { font-size: 1.1rem; color: var(--text-muted); }
.wa-mock-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.7rem;
  color: var(--bg);
  flex-shrink: 0;
}
.wa-mock-body {
  padding: 14px;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v60M0 30h60' stroke='rgba(255,255,255,0.012)' stroke-width='1'/%3E%3C/svg%3E") repeat;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.wa-mock-msg {
  background: #1f2c34;
  border-radius: 0 12px 12px 12px;
  padding: 10px 12px;
  font-size: 0.72rem;
  color: var(--text);
  line-height: 1.55;
  max-width: 85%;
  position: relative;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
}
.wa-mock-msg.reply {
  background: #005c4b;
  border-radius: 12px 0 12px 12px;
  align-self: flex-end;
}
.wa-mock-time {
  display: block;
  text-align: right;
  font-size: 0.58rem;
  color: rgba(255,255,255,0.3);
  margin-top: 4px;
}

/* ═══ DASHBOARD MOCKUP ═══ */
.dashboard-mock {
  background: var(--surface);
  border-radius: 20px;
  border: 1px solid var(--border);
  overflow: hidden;
  box-shadow: 0 50px 100px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.03);
  transform-style: preserve-3d;
}
.dash-topbar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
}
.dash-tab {
  padding: 10px 20px;
  font-size: 0.72rem;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  font-weight: 500;
  transition: all 0.3s;
}
.dash-tab.active {
  color: var(--jade);
  border-bottom-color: var(--jade);
}
.dash-kpis {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1px;
  background: var(--border);
}
.dash-kpi {
  padding: 18px 16px;
  background: var(--surface);
  text-align: center;
}
.dash-kpi-label {
  font-size: 0.6rem;
  color: var(--text-muted);
  margin-bottom: 6px;
  letter-spacing: 0.04em;
}
.dash-kpi-val {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}
.dash-chart {
  padding: 18px;
  border-bottom: 1px solid var(--border);
}
.dash-chart-title {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-bottom: 14px;
}
.dash-bars {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  height: 80px;
}
.dash-bar {
  flex: 1;
  background: rgba(74,222,128,0.12);
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 10px;
  transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
}
.dash-bar:hover { background: rgba(74,222,128,0.25); }
.dash-bar.high {
  background: linear-gradient(to top, var(--jade-deep), var(--jade));
  box-shadow: 0 0 16px rgba(74,222,128,0.15);
}
.dash-bar span {
  position: absolute;
  bottom: -16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.55rem;
  color: var(--text-muted);
}
.dash-clients { padding: 12px 16px; }
.dash-client-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}
.dash-client-row + .dash-client-row { border-top: 1px solid var(--border); }
.dash-cl-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.6rem;
  color: var(--bg);
  flex-shrink: 0;
}
.dash-cl-info { flex: 1; font-size: 0.75rem; font-weight: 600; }
.dash-cl-sub { font-size: 0.6rem; color: var(--text-muted); font-weight: 400; }
.dash-cl-spent {
  font-size: 0.75rem;
  color: var(--jade);
  font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
}

/* ═══ SLIDE 2: SOLUTION ORBIT ═══ */
.slide-solution {
  width: 100%;
  max-width: 1000px;
  text-align: center;
  position: relative;
}
.solution-glow {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%,-50%);
  width: 400px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(74,222,128,0.06), transparent 65%);
  pointer-events: none;
  filter: blur(80px);
  animation: glowPulse 6s ease-in-out infinite alternate;
}
.slide-solution h2 {
  font-size: clamp(2.2rem, 4.5vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin-bottom: 16px;
}
.slide-solution h2 em { font-style: italic; font-weight: 500; }
.solution-desc {
  color: var(--text-secondary);
  font-size: 1rem;
  max-width: 500px;
  margin: 0 auto 48px;
  line-height: 1.6;
}
.solution-orbit {
  position: relative;
  width: 380px;
  height: 380px;
  margin: 0 auto;
}
.orbit-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--jade), var(--jade-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  box-shadow: 0 0 50px var(--jade-glow), 0 0 100px rgba(74,222,128,0.1);
  animation: centerPulse 4s ease-in-out infinite;
}
@keyframes centerPulse {
  0%, 100% { box-shadow: 0 0 50px var(--jade-glow), 0 0 100px rgba(74,222,128,0.1); }
  50% { box-shadow: 0 0 70px var(--jade-glow), 0 0 140px rgba(74,222,128,0.15); }
}
.orbit-center-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--bg);
  font-weight: 700;
}
.orbit-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(74,222,128,0.08);
}
.orbit-ring.ring-1 {
  inset: 50px;
  animation: orbitSpin 25s linear infinite;
}
.orbit-ring.ring-2 {
  inset: 0;
  animation: orbitSpin 40s linear infinite reverse;
  border-style: dashed;
  border-color: rgba(74,222,128,0.05);
}
@keyframes orbitSpin { to { transform: rotate(360deg); } }
.orbit-item {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.orbit-ring.ring-1 .orbit-item { animation: orbitCounterSpin 25s linear infinite; }
.orbit-ring.ring-2 .orbit-item { animation: orbitCounterSpin 40s linear infinite reverse; }
@keyframes orbitCounterSpin {
  to { transform: translate(-50%,-50%) rotate(-360deg); }
}
.orbit-ring.ring-1 .orbit-item:nth-child(2) { animation-name: orbitCounterSpinR; }
.orbit-ring.ring-1 .orbit-item:nth-child(3) { animation-name: orbitCounterSpinB; }
.orbit-ring.ring-1 .orbit-item:nth-child(4) { animation-name: orbitCounterSpinL; }
@keyframes orbitCounterSpinR { to { transform: translate(50%,-50%) rotate(-360deg); } }
@keyframes orbitCounterSpinB { to { transform: translate(-50%,50%) rotate(-360deg); } }
@keyframes orbitCounterSpinL { to { transform: translate(-50%,-50%) rotate(-360deg); } }
.orbit-ring.ring-2 .orbit-item:nth-child(1) { animation-name: orbitCS2TR; }
.orbit-ring.ring-2 .orbit-item:nth-child(2) { animation-name: orbitCS2BR; }
.orbit-ring.ring-2 .orbit-item:nth-child(3) { animation-name: orbitCS2BL; }
.orbit-ring.ring-2 .orbit-item:nth-child(4) { animation-name: orbitCS2TL; }
@keyframes orbitCS2TR { to { transform: translate(50%,-50%) rotate(360deg); } }
@keyframes orbitCS2BR { to { transform: translate(50%,50%) rotate(360deg); } }
@keyframes orbitCS2BL { to { transform: translate(-50%,50%) rotate(360deg); } }
@keyframes orbitCS2TL { to { transform: translate(-50%,-50%) rotate(360deg); } }
.orbit-node {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  transition: transform 0.3s;
}
.orbit-node.jade-bg { color: var(--bg); }
.orbit-item span {
  font-size: 0.58rem;
  color: var(--text-muted);
  white-space: nowrap;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* ═══ SLIDE 6: STATS ═══ */
.slide-stats {
  width: 100%;
  max-width: 1000px;
  text-align: center;
  position: relative;
}
.stats-glow {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translate(-50%,-50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(74,222,128,0.06), transparent 65%);
  pointer-events: none;
  filter: blur(80px);
}
.slide-stats h2 {
  font-size: clamp(2.2rem, 4.5vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin-bottom: 56px;
}
.stats-mega-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.stat-mega-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 36px 28px;
  text-align: left;
  transition: all 0.5s cubic-bezier(0.16,1,0.3,1);
  position: relative;
  overflow: hidden;
}
.stat-mega-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(74,222,128,0.2), transparent);
  opacity: 0;
  transition: opacity 0.4s;
}
.stat-mega-card:hover {
  border-color: rgba(74,222,128,0.12);
  transform: translateY(-6px);
  box-shadow: 0 24px 60px rgba(0,0,0,0.3);
}
.stat-mega-card:hover::before { opacity: 1; }
.stat-mega-num {
  font-size: 3.5rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--jade);
  line-height: 1;
  margin-bottom: 6px;
}
.stat-mega-label {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 6px;
}
.stat-mega-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
}
.stat-mega-bar {
  height: 4px;
  background: rgba(255,255,255,0.06);
  border-radius: 4px;
  overflow: hidden;
}
.stat-mega-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--jade), var(--jade-deep));
  border-radius: 4px;
  box-shadow: 0 0 12px rgba(74,222,128,0.2);
  animation: barGrow 2s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes barGrow {
  from { width: 0% !important; }
}

/* ═══ SLIDE 7: PRICING ═══ */
.slide-pricing {
  width: 100%;
  max-width: 1000px;
  text-align: center;
}
.slide-pricing h2 {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin-bottom: 48px;
}
.pricing-cards {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  align-items: stretch;
}
.pricing-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 32px 24px;
  text-align: left;
  position: relative;
  transition: all 0.5s cubic-bezier(0.16,1,0.3,1);
}
.pricing-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 24px 60px rgba(0,0,0,0.3);
}
.pricing-card.featured {
  border-color: var(--jade);
  background: linear-gradient(135deg, rgba(74,222,128,0.06), rgba(74,222,128,0.02));
  box-shadow: 0 0 50px rgba(74,222,128,0.06), inset 0 1px 0 rgba(74,222,128,0.1);
}
.pricing-card.featured:hover {
  box-shadow: 0 24px 80px rgba(74,222,128,0.1), 0 0 60px rgba(74,222,128,0.08);
}
.pc-badge {
  position: absolute;
  top: -11px;
  right: 20px;
  background: var(--jade);
  color: var(--bg);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 4px 16px;
  border-radius: 100px;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 16px rgba(74,222,128,0.3);
}
.pc-tier {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 14px;
  letter-spacing: 0.03em;
}
.pc-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 4px;
}
.pc-currency {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-secondary);
}
.pc-amount {
  font-size: 2.8rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}
.pricing-card.featured .pc-amount { color: var(--jade); }
.pc-mo { font-size: 0.85rem; color: var(--text-muted); }
.pc-period {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-bottom: 22px;
}
.pc-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pc-features li {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.pricing-card.featured .pc-features li { color: var(--text); }

/* ═══ SLIDE 8: CLOSE ═══ */
.slide-close {
  text-align: center;
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.close-axis {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  width: 500px;
  height: 500px;
  border: 1px solid rgba(74,222,128,0.04);
  border-radius: 50%;
  animation: deckAxisSpin 35s linear infinite;
}
.close-axis::before {
  content: '';
  position: absolute;
  inset: 80px;
  border: 1px solid rgba(74,222,128,0.03);
  border-radius: 50%;
}
.close-axis-2 {
  width: 650px;
  height: 650px;
  animation-direction: reverse;
  animation-duration: 50s;
  border-color: rgba(74,222,128,0.025);
}
.close-glow {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%,-50%);
  width: 500px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(74,222,128,0.1), transparent 65%);
  pointer-events: none;
  filter: blur(80px);
  animation: glowPulse 5s ease-in-out infinite alternate;
}
.close-glow-2 {
  width: 350px;
  height: 350px;
  top: 65%;
  background: radial-gradient(ellipse, rgba(34,197,94,0.06), transparent 65%);
  animation-delay: -2.5s;
  animation-duration: 7s;
}
.close-kanji {
  position: absolute;
  font-size: 18rem;
  color: rgba(74,222,128,0.02);
  font-weight: 300;
  pointer-events: none;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  line-height: 1;
  animation: kanjiFloat 10s ease-in-out infinite alternate;
}
.close-content {
  position: relative;
  z-index: 2;
}
.close-content h2 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin-bottom: 20px;
}
.close-content h2 em { font-style: italic; font-weight: 500; font-size: 1.1em; }
.close-desc {
  font-size: 1.05rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 44px;
}
.close-steps {
  display: flex;
  gap: 28px;
  justify-content: center;
  margin-bottom: 44px;
}
.close-step {
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
  padding: 14px 20px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
}
.close-step:hover {
  border-color: rgba(74,222,128,0.15);
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.2);
}
.close-step-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--bg);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(74,222,128,0.2);
}
.close-step strong { font-size: 0.88rem; display: block; }
.close-url {
  padding: 14px 32px;
  border-radius: 100px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  display: inline-block;
  transition: all 0.4s;
  backdrop-filter: blur(4px);
}
.close-url:hover {
  border-color: rgba(74,222,128,0.2);
  box-shadow: 0 0 30px rgba(74,222,128,0.06);
}

/* ═══ RESPONSIVE ═══ */
/* ═══ TABLET (1024px and below) ═══ */
@media (max-width: 1024px) {
  .deck-slide { padding: 60px 48px; }
  .deck-arrow-right { right: 60px; }

  .feature-split { gap: 40px; }
  .phone-mock { width: 260px; }
  .wa-mock { width: 280px; }

  .cover-axis { width: 500px; height: 500px; }
  .cover-axis-2 { width: 650px; height: 650px; }
  .cover-kanji { font-size: 18rem; }

  .pricing-cards { gap: 12px; }
  .pricing-card { padding: 24px 20px; }
  .pc-amount { font-size: 2.4rem; }

  .close-steps { gap: 16px; }
  .close-step { padding: 12px 16px; }
}

/* ═══ MOBILE (768px and below) ═══ */
@media (max-width: 768px) {
  .deck-slide { padding: 70px 20px 50px; }
  .deck-dots { right: 10px; gap: 8px; }
  .deck-dot { width: 6px; height: 6px; }
  .deck-arrow { display: none; }
  .deck-counter { right: 10px; bottom: 10px; font-size: 0.65rem; }
  .deck-logo { left: 12px; top: 12px; }

  /* Cover */
  .cover-content h1 { font-size: 2.4rem; margin-top: 24px; }
  .cover-kanji { font-size: 12rem; }
  .cover-axis { width: 350px; height: 350px; }
  .cover-axis-2 { width: 450px; height: 450px; }
  .cover-sub { font-size: 0.95rem; margin-bottom: 28px; }
  .cover-tags { gap: 6px; }
  .cover-tags span { font-size: 0.6rem; padding: 5px 12px; }
  .cover-glow { width: 350px; height: 280px; }
  .cover-glow-2 { width: 200px; height: 200px; }
  .cover-hint { font-size: 0.62rem; }

  /* Problem */
  .slide-problem h2 { font-size: 1.8rem; margin-bottom: 28px; }
  .problem-grid { grid-template-columns: 1fr; gap: 10px; }
  .problem-card { padding: 20px; }
  .problem-stat { font-size: 1.3rem; }
  .problem-icon { font-size: 1.4rem; margin-bottom: 10px; }
  .problem-desc { font-size: 0.75rem; }
  .problem-glow { width: 300px; height: 300px; top: -60px; right: -60px; }
  .problem-glow-2 { width: 250px; height: 250px; }

  /* Solution */
  .slide-solution h2 { font-size: 1.8rem; }
  .solution-desc { font-size: 0.88rem; margin-bottom: 32px; }
  .solution-orbit { width: 260px; height: 260px; }
  .orbit-center { width: 60px; height: 60px; }
  .orbit-center-inner span:first-child { font-size: 1.4rem; }
  .orbit-center-inner span:last-child { font-size: 0.55rem; }
  .orbit-node { width: 32px; height: 32px; font-size: 0.9rem; }
  .orbit-item span { font-size: 0.5rem; }
  .orbit-ring.ring-1 { inset: 40px; }

  /* Feature splits */
  .slide-eyebrow { font-size: 0.62rem; letter-spacing: 0.18em; }
  .feature-split { grid-template-columns: 1fr; gap: 24px; }
  .feature-split.reverse { direction: ltr; }
  .feature-visual { order: -1; }
  .feature-text h2 { font-size: 1.7rem; margin-bottom: 20px; }
  .feature-list { gap: 10px; }
  .feature-list li { font-size: 0.8rem; }
  .feature-stat-row { gap: 32px; margin-top: 24px; }
  .feature-stat-num { font-size: 2rem; }
  .feature-stat-label { font-size: 0.65rem; }

  .phone-mock { width: 220px; border-radius: 32px; }
  .phone-mock-notch { width: 80px; height: 20px; }
  .phone-mock-screen { border-radius: 24px; padding: 14px 10px; min-height: 340px; }
  .mock-bk-service { padding: 8px 10px; font-size: 0.68rem; }
  .mock-bk-price { font-size: 0.65rem; }
  .mock-slot { padding: 5px 10px; font-size: 0.62rem; }
  .mock-bk-btn { padding: 9px; font-size: 0.72rem; }

  .wa-mock { width: 250px; border-radius: 20px; }
  .wa-mock-msg { font-size: 0.65rem; padding: 8px 10px; }
  .wa-mock-body { min-height: 260px; padding: 10px; }

  .dashboard-mock { border-radius: 16px; }
  .dash-kpi { padding: 12px 10px; }
  .dash-kpi-val { font-size: 1.3rem; }
  .dash-chart { padding: 14px; }
  .dash-bars { height: 60px; }
  .dash-cl-info { font-size: 0.68rem; }

  /* Stats */
  .slide-stats h2 { font-size: 1.8rem; margin-bottom: 32px; }
  .stats-mega-grid { grid-template-columns: 1fr; gap: 10px; }
  .stat-mega-card { padding: 24px 20px; }
  .stat-mega-num { font-size: 2.4rem; }
  .stat-mega-label { font-size: 0.88rem; }
  .stat-mega-desc { font-size: 0.75rem; }

  /* Pricing */
  .slide-pricing h2 { font-size: 1.8rem; margin-bottom: 32px; }
  .pricing-cards { grid-template-columns: 1fr; gap: 12px; max-width: 340px; margin: 0 auto; }
  .pricing-card { padding: 24px 20px; border-radius: 20px; }
  .pc-amount { font-size: 2.2rem; }
  .pc-tier { font-size: 0.78rem; margin-bottom: 10px; }
  .pc-features li { font-size: 0.75rem; }

  /* Close */
  .close-content h2 { font-size: 2rem; }
  .close-desc { font-size: 0.92rem; margin-bottom: 32px; }
  .close-kanji { font-size: 10rem; }
  .close-axis { width: 350px; height: 350px; }
  .close-axis-2 { width: 450px; height: 450px; }
  .close-glow { width: 350px; height: 280px; }
  .close-glow-2 { width: 250px; height: 200px; }
  .close-steps { flex-direction: column; gap: 10px; align-items: center; width: 100%; }
  .close-step { width: 100%; max-width: 300px; padding: 12px 16px; }
  .close-step-num { width: 32px; height: 32px; font-size: 0.72rem; }
  .close-step strong { font-size: 0.82rem; }
  .close-url { padding: 10px 24px; }
  .close-url span { font-size: 0.78rem !important; }
}

/* ═══ SMALL MOBILE (480px and below) ═══ */
@media (max-width: 480px) {
  .deck-slide { padding: 60px 14px 40px; }

  .cover-content h1 { font-size: 2rem; }
  .cover-kanji { font-size: 8rem; }
  .cover-axis { width: 280px; height: 280px; }
  .cover-axis-2 { width: 360px; height: 360px; }
  .cover-sub { font-size: 0.85rem; }
  .cover-tags span { font-size: 0.55rem; padding: 4px 9px; }

  .slide-problem h2 { font-size: 1.5rem; }
  .slide-solution h2 { font-size: 1.5rem; }
  .feature-text h2 { font-size: 1.4rem; }

  .solution-orbit { width: 220px; height: 220px; }
  .orbit-center { width: 50px; height: 50px; }
  .orbit-center-inner span:first-child { font-size: 1.1rem; }
  .orbit-center-inner span:last-child { font-size: 0.45rem; }
  .orbit-node { width: 28px; height: 28px; font-size: 0.75rem; }
  .orbit-ring.ring-1 { inset: 30px; }

  .phone-mock { width: 200px; }
  .wa-mock { width: 220px; }

  .stat-mega-num { font-size: 2rem; }
  .stat-mega-card { padding: 20px 16px; }

  .slide-pricing h2 { font-size: 1.5rem; }
  .pricing-cards { max-width: 300px; }
  .pc-amount { font-size: 1.9rem; }

  .close-content h2 { font-size: 1.7rem; }
  .close-kanji { font-size: 7rem; }
  .close-steps { gap: 8px; }
}
`;
