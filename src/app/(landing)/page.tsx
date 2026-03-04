"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Calendar,
  CreditCard,
  Bell,
  BarChart3,
  Users,
  Zap,
  ArrowRight,
  Check,
  Star,
  Clock,
  TrendingUp,
  MessageSquare,
  Menu,
  X,
  Play,
  ChevronDown,
  Scissors,
  Dumbbell,
  Stethoscope,
  Sparkles,
  Heart,
  Globe,
  Send,
  Rocket,
  Crown,
  Shield,
  Plus,
  Minus,
} from "lucide-react";
import { AktivoLogo } from "@/components/brand/aktivo-logo";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/premium/magnetic-button";
import { GlassCard } from "@/components/premium/glass-card";
import { GradientText } from "@/components/premium/gradient-text";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ──────────────────────────────────────────
   Data
   ────────────────────────────────────────── */

const navLinks = [
  { label: "Funciones", href: "#features" },
  { label: "Como funciona", href: "#how-it-works" },
  { label: "Testimonios", href: "#testimonials" },
  { label: "Precios", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const businessTypes = [
  { icon: Scissors, label: "Barberias" },
  { icon: Sparkles, label: "Esteticas" },
  { icon: Stethoscope, label: "Consultorios" },
  { icon: Dumbbell, label: "Personal Trainers" },
  { icon: Heart, label: "Pilates" },
  { icon: Globe, label: "Spas" },
  { icon: Star, label: "Nail Studios" },
  { icon: Shield, label: "Centros de Salud" },
];

const features = [
  {
    icon: Calendar,
    title: "Turnos Inteligentes",
    description:
      "Reservas online 24/7. Tus clientes eligen servicio, profesional y horario en segundos.",
    size: "large" as const,
  },
  {
    icon: CreditCard,
    title: "Pagos Integrados",
    description:
      "Cobra senas o el total con MercadoPago. Sin fricciones, sin excusas de no-show.",
    size: "large" as const,
  },
  {
    icon: Bell,
    title: "Notificaciones Multicanal",
    description:
      "WhatsApp y email automaticos. Confirmacion, recordatorio y mas.",
    size: "small" as const,
  },
  {
    icon: BarChart3,
    title: "Analytics en Tiempo Real",
    description:
      "Dashboard con KPIs, tendencias y reportes. Toma decisiones con datos.",
    size: "small" as const,
  },
  {
    icon: Users,
    title: "CRM de Clientes",
    description:
      "Historial, preferencias y segmentacion. Conoce a tu clientela mejor que nadie.",
    size: "small" as const,
  },
  {
    icon: Zap,
    title: "Multi-Negocio",
    description:
      "Gestionas mas de una sucursal? Cada una con su config, staff y branding.",
    size: "small" as const,
  },
];

const steps = [
  {
    number: "01",
    title: "Crea tu cuenta",
    description: "En 2 minutos configuras tu negocio, servicios y equipo.",
    icon: Zap,
  },
  {
    number: "02",
    title: "Comparte tu link",
    description: "Tus clientes reservan desde cualquier dispositivo, 24/7.",
    icon: Send,
  },
  {
    number: "03",
    title: "Gestiona y crece",
    description: "Dashboard, pagos y analytics. Todo en piloto automatico.",
    icon: Rocket,
  },
];

const dashboardTabs = [
  { id: "turnos", label: "Turnos", icon: Calendar },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "pagos", label: "Pagos", icon: CreditCard },
];

const integrations = [
  {
    name: "MercadoPago",
    description: "Cobra senas y pagos completos directo desde tu cuenta.",
    icon: CreditCard,
    comingSoon: false,
  },
  {
    name: "WhatsApp",
    description: "Recordatorios y confirmaciones automaticas a tus clientes.",
    icon: MessageSquare,
    comingSoon: false,
  },
  {
    name: "Email",
    description: "Notificaciones profesionales para cada reserva.",
    icon: Send,
    comingSoon: false,
  },
  {
    name: "Google Calendar",
    description: "Sincroniza tus turnos con tu calendario personal.",
    icon: Calendar,
    comingSoon: true,
  },
  {
    name: "Instagram",
    description: "Reservas directas desde tu perfil de negocio.",
    icon: Globe,
    comingSoon: true,
  },
];

const stats = [
  { value: 2000, suffix: "+", label: "Negocios activos" },
  { value: 150000, suffix: "+", label: "Turnos gestionados" },
  { value: 98, suffix: "%", label: "Tasa de satisfaccion" },
  { value: 70, suffix: "%", label: "Reduccion de no-shows" },
];

const plans = [
  {
    name: "Free",
    price: "Gratis",
    annualPrice: "Gratis",
    description: "Para empezar sin riesgo",
    icon: Zap,
    features: [
      "Hasta 50 turnos/mes",
      "1 profesional",
      "Pagina de reservas",
      "Notificaciones basicas",
    ],
  },
  {
    name: "Starter",
    price: "$4.990",
    annualPrice: "$3.990",
    period: "/mes",
    description: "Para negocios en crecimiento",
    popular: true,
    icon: Rocket,
    features: [
      "Turnos ilimitados",
      "Hasta 5 profesionales",
      "WhatsApp + Email",
      "Dashboard completo",
      "Pagos con MercadoPago",
    ],
  },
  {
    name: "Professional",
    price: "$9.990",
    annualPrice: "$7.990",
    period: "/mes",
    description: "Para negocios consolidados",
    icon: Crown,
    features: [
      "Todo de Starter",
      "Staff ilimitado",
      "CRM avanzado",
      "MP con cuenta propia",
      "Branding personalizado",
      "API access",
    ],
  },
];

const testimonials = [
  {
    name: "Lucas Fernandez",
    business: "Barberia Don Lucas",
    city: "Rosario, Santa Fe",
    text: "Los no-show bajaron un 70% desde que activamos las senas con MercadoPago. El mejor cambio que hice para mi negocio.",
    rating: 5,
    highlight: "No-shows bajaron 70%",
    featured: true,
  },
  {
    name: "Maria Gonzalez",
    business: "Estudio MG Estetica",
    city: "Palermo, CABA",
    text: "Antes perdia 2 horas por dia coordinando turnos por WhatsApp. Ahora mis clientas reservan solas y yo me enfoco en atender.",
    rating: 5,
    highlight: "2 horas ahorradas por dia",
    featured: false,
  },
  {
    name: "Carolina Ruiz",
    business: "Pilates Studio CR",
    city: "Cordoba Capital",
    text: "Gestiono 3 sucursales desde una sola cuenta. El dashboard me da los numeros que necesito para tomar decisiones rapidas.",
    rating: 5,
    highlight: "3 sucursales, 1 cuenta",
    featured: false,
  },
  {
    name: "Martin Diaz",
    business: "Odontologia Integral",
    city: "La Plata, Buenos Aires",
    text: "Mis pacientes reciben el recordatorio por WhatsApp y email automatico. Reducimos las faltas a casi cero.",
    rating: 5,
    highlight: "Faltas casi cero",
    featured: false,
  },
  {
    name: "Sofia Alvarez",
    business: "Nails by Sofi",
    city: "San Isidro, Buenos Aires",
    text: "La pagina de reservas es hermosa y mis clientas me felicitan. Se siente super profesional.",
    rating: 5,
    highlight: "Booking page premium",
    featured: false,
  },
  {
    name: "Federico Torres",
    business: "FT Personal Training",
    city: "Mendoza Capital",
    text: "En una semana ya tenia todo configurado. Los turnos se reservan solos y yo puedo entrenar tranquilo.",
    rating: 5,
    highlight: "Setup en 1 semana",
    featured: false,
  },
  {
    name: "Valentina Lopez",
    business: "VL Spa & Wellness",
    city: "Recoleta, CABA",
    text: "El CRM me permite conocer las preferencias de cada clienta. El trato personalizado genero un 40% mas de fidelizacion.",
    rating: 5,
    highlight: "40% mas fidelizacion",
    featured: false,
  },
  {
    name: "Gonzalo Martinez",
    business: "GM Barbershop",
    city: "San Miguel de Tucuman",
    text: "Mis barberos manejan su propia agenda desde el celular. Ya no necesito estar encima de cada turno.",
    rating: 5,
    highlight: "Equipo autonomo",
    featured: false,
  },
];

const faqs = [
  {
    question: "Cuanto tarda la configuracion inicial?",
    answer:
      "Menos de 5 minutos. Creas tu cuenta, agregas tus servicios y profesionales, y ya podes compartir tu link de reservas.",
  },
  {
    question: "El plan gratuito es realmente gratis?",
    answer:
      "Si, 100% gratis para siempre. Sin tarjeta de credito, sin pruebas que vencen. Incluye hasta 50 turnos por mes y 1 profesional.",
  },
  {
    question: "Como funcionan los pagos con MercadoPago?",
    answer:
      "Conectas tu cuenta de MercadoPago en 2 clicks. Tus clientes pagan senas o el total al reservar, y el dinero va directo a tu cuenta.",
  },
  {
    question: "Puedo migrar mis datos desde otra plataforma?",
    answer:
      "Si, ofrecemos asistencia para migrar tu base de clientes e historial. Contacta a nuestro equipo y te ayudamos sin costo.",
  },
  {
    question: "Hay limite de turnos en los planes pagos?",
    answer:
      "No. Los planes Starter y Professional incluyen turnos ilimitados. Solo el plan Free tiene un limite de 50 turnos por mes.",
  },
  {
    question: "Puedo gestionar multiples sucursales?",
    answer:
      "Si, con el plan Professional podes gestionar todas tus sucursales desde una sola cuenta, cada una con su configuracion independiente.",
  },
  {
    question: "Que tipo de soporte ofrecen?",
    answer:
      "Soporte por chat y email en espanol. Los planes pagos tienen soporte prioritario con respuesta en menos de 2 horas.",
  },
  {
    question: "Puedo cancelar en cualquier momento?",
    answer:
      "Si, sin preguntas ni permanencia minima. Cancelas desde tu panel y seguis usando el plan Free.",
  },
];

const footerLinks = [
  {
    title: "Producto",
    links: [
      { label: "Funciones", href: "#features" },
      { label: "Precios", href: "#pricing" },
      { label: "Integraciones", href: "#integrations" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre nosotros", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contacto", href: "#" },
      { label: "Soporte", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terminos de servicio", href: "#" },
      { label: "Politica de privacidad", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
];

/* ──────────────────────────────────────────
   Page Component
   ────────────────────────────────────────── */

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const productTourRef = useRef<HTMLDivElement>(null);
  const integrationsRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const testimonialRow1Ref = useRef<HTMLDivElement>(null);
  const testimonialRow2Ref = useRef<HTMLDivElement>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* ── Hero entrance timeline ── */
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        ".nav-bar",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6 }
      )
        .fromTo(
          ".hero-badge",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.2"
        )
        .fromTo(
          ".hero-title",
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.3"
        )
        .fromTo(
          ".hero-subtitle",
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.4"
        )
        .fromTo(
          ".hero-cta",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.3"
        )
        .fromTo(
          ".hero-trust",
          { opacity: 0 },
          { opacity: 1, duration: 0.5 },
          "-=0.2"
        )
        .fromTo(
          ".hero-visual",
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 1 },
          "-=0.4"
        )
        .fromTo(
          ".hero-toast",
          { opacity: 0, x: 40 },
          { opacity: 1, x: 0, duration: 0.5, stagger: 0.2 },
          "-=0.5"
        );

      /* ── Hero blur orbs infinite drift ── */
      gsap.to(".hero-orb-1", {
        x: 30,
        y: -20,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".hero-orb-2", {
        x: -25,
        y: 25,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      /* ── Social proof marquee ── */
      if (marqueeRef.current) {
        const marqueeWidth = marqueeRef.current.scrollWidth / 2;
        gsap.to(marqueeRef.current, {
          x: -marqueeWidth,
          duration: 30,
          repeat: -1,
          ease: "none",
        });
      }

      /* ── Features stagger ── */
      gsap.fromTo(
        ".feature-card",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
          },
        }
      );

      /* ── How It Works ── */
      gsap.fromTo(
        ".step-line",
        { scaleX: 0 },
        {
          scaleX: 1,
          scrollTrigger: {
            trigger: howItWorksRef.current,
            start: "top 75%",
            end: "center center",
            scrub: true,
          },
        }
      );
      gsap.fromTo(
        ".step-card",
        { opacity: 0, x: -40 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.2,
          scrollTrigger: {
            trigger: howItWorksRef.current,
            start: "top 75%",
          },
        }
      );

      /* ── Product Tour ── */
      gsap.fromTo(
        ".product-tour-container",
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: productTourRef.current,
            start: "top 75%",
          },
        }
      );

      /* ── Integrations ── */
      gsap.fromTo(
        ".integration-card",
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.1,
          scrollTrigger: {
            trigger: integrationsRef.current,
            start: "top 80%",
          },
        }
      );

      /* ── Testimonials featured ── */
      gsap.fromTo(
        ".testimonial-featured",
        { opacity: 0, scale: 0.96 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: testimonialsRef.current,
            start: "top 80%",
          },
        }
      );

      /* ── Testimonial marquee rows ── */
      if (testimonialRow1Ref.current) {
        gsap.to(testimonialRow1Ref.current, {
          xPercent: -50,
          duration: 40,
          repeat: -1,
          ease: "none",
        });
      }
      if (testimonialRow2Ref.current) {
        gsap.fromTo(
          testimonialRow2Ref.current,
          { xPercent: -50 },
          {
            xPercent: 0,
            duration: 45,
            repeat: -1,
            ease: "none",
          }
        );
      }

      /* ── Stats counters ── */
      gsap.fromTo(
        ".stat-item",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.2,
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 85%",
            onEnter: () => {
              document
                .querySelectorAll<HTMLElement>(".stat-number")
                .forEach((el) => {
                  const target = parseInt(el.dataset.target || "0", 10);
                  const obj = { val: 0 };
                  gsap.to(obj, {
                    val: target,
                    duration: 2,
                    ease: "power2.out",
                    onUpdate: () => {
                      el.textContent = new Intl.NumberFormat("es-AR").format(
                        Math.round(obj.val)
                      );
                    },
                  });
                });
            },
            once: true,
          },
        }
      );

      /* ── Pricing stagger ── */
      gsap.fromTo(
        ".pricing-card",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          scrollTrigger: {
            trigger: pricingRef.current,
            start: "top 80%",
            onEnter: () => {
              gsap.to(".pricing-popular", {
                y: -4,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
              });
            },
            once: true,
          },
        }
      );

      /* ── FAQ stagger ── */
      gsap.fromTo(
        ".faq-item",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          scrollTrigger: {
            trigger: faqRef.current,
            start: "top 80%",
          },
        }
      );

      /* ── CTA fade up ── */
      gsap.fromTo(
        ".final-cta",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 80%",
          },
        }
      );

      /* ── Footer fade in ── */
      gsap.fromTo(
        ".footer-content",
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 95%",
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const featuredTestimonial = testimonials.find((t) => t.featured)!;
  const marqueeTestimonials = testimonials.filter((t) => !t.featured);
  const row1 = marqueeTestimonials.slice(0, 4);
  const row2 = marqueeTestimonials.slice(4);

  return (
    <div className="min-h-screen">
      {/* ════════════════════════════════════════
          1. NAVBAR
          ════════════════════════════════════════ */}
      <nav
        className={`nav-bar fixed top-0 left-0 right-0 z-50 transition-all duration-300 opacity-0 ${
          navScrolled ? "glass" : "bg-transparent border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <AktivoLogo size="sm" />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/iniciar-sesion">
              <Button variant="ghost" size="sm">
                Iniciar sesion
              </Button>
            </Link>
            <Link href="/registrarse">
              <Button size="sm" className="brand-gradient text-white border-0">
                Empezar gratis
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-background border-border">
                <div className="flex flex-col gap-6 mt-8">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                  <Separator />
                  <Link
                    href="/iniciar-sesion"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="outline" className="w-full">
                      Iniciar sesion
                    </Button>
                  </Link>
                  <Link
                    href="/registrarse"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full brand-gradient text-white border-0">
                      Empezar gratis
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          2. HERO
          ════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-grid-pattern flex items-center"
      >
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="hero-orb-1 absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="hero-orb-2 absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <div>
              <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full glass shimmer text-sm text-muted-foreground mb-8 opacity-0">
                <Star className="w-4 h-4 text-primary" />
                <span>2.000+ negocios confian en Aktivo</span>
              </div>

              <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold tracking-tight mb-6 opacity-0">
                Tus clientes reservan.{" "}
                <GradientText as="span">Vos creces.</GradientText>
              </h1>

              <p className="hero-subtitle text-lg sm:text-xl text-muted-foreground max-w-lg mb-10 opacity-0">
                Turnos, pagos, notificaciones y CRM en una sola plataforma.
                Deja de perder tiempo y empeza a crecer.
              </p>

              <div className="hero-cta flex flex-col sm:flex-row items-start gap-4 opacity-0">
                <Link href="/registrarse">
                  <MagneticButton className="brand-gradient text-white px-8 py-3 rounded-xl font-medium text-lg flex items-center gap-2 glow-primary">
                    Empezar gratis
                    <ArrowRight className="w-5 h-5" />
                  </MagneticButton>
                </Link>
                <a href="#how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Como funciona
                  </Button>
                </a>
              </div>

              <p className="hero-trust text-sm text-muted-foreground mt-6 flex items-center gap-2 opacity-0">
                <Check className="w-4 h-4 text-emerald-400" />
                Gratis para siempre. Sin tarjeta de credito.
              </p>
            </div>

            {/* Right: Dashboard visual */}
            <div className="hero-visual opacity-0 lg:perspective-[1200px]">
              <div className="lg:[transform:rotateY(-8deg)_rotateX(4deg)] transition-transform duration-500 hover:lg:[transform:rotateY(-2deg)_rotateX(1deg)] relative">
                <div className="glass rounded-2xl p-2 sm:p-4">
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="flex">
                      {/* Fake sidebar */}
                      <div className="hidden sm:flex flex-col w-48 border-r border-border bg-[#0f0f12] p-4 gap-1">
                        <div className="flex items-center gap-2 mb-6">
                          <div className="w-6 h-6 rounded-md brand-gradient" />
                          <span className="font-heading text-sm font-bold brand-text">
                            Aktivo
                          </span>
                        </div>
                        {[
                          "Turnos",
                          "Calendario",
                          "Clientes",
                          "Servicios",
                          "Equipo",
                          "Pagos",
                          "Analytics",
                        ].map((item, i) => (
                          <div
                            key={item}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                              i === 0
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground"
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded ${
                                i === 0 ? "bg-primary/30" : "bg-muted"
                              }`}
                            />
                            {item}
                          </div>
                        ))}
                      </div>
                      {/* Main content */}
                      <div className="flex-1 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Dashboard
                            </p>
                            <p className="text-sm font-heading font-semibold">
                              Barberia Don Lucas
                            </p>
                          </div>
                          <div className="w-7 h-7 rounded-full bg-muted" />
                        </div>
                        {/* KPI cards */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
                          {[
                            {
                              label: "Turnos hoy",
                              value: "12",
                              icon: Calendar,
                              color: "text-primary",
                            },
                            {
                              label: "Ingresos mes",
                              value: "$248.5k",
                              icon: TrendingUp,
                              color: "text-emerald-400",
                            },
                            {
                              label: "Clientes",
                              value: "847",
                              icon: Users,
                              color: "text-accent",
                            },
                            {
                              label: "Ocupacion",
                              value: "89%",
                              icon: Clock,
                              color: "text-amber-400",
                            },
                          ].map((kpi) => (
                            <div key={kpi.label} className="glass rounded-lg p-2 sm:p-3">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {kpi.label}
                                </p>
                                <kpi.icon
                                  className={`w-3 h-3 ${kpi.color} shrink-0`}
                                />
                              </div>
                              <p className="text-base sm:text-lg font-heading font-bold truncate">
                                {kpi.value}
                              </p>
                            </div>
                          ))}
                        </div>
                        {/* Mini appointments + activity */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="glass rounded-lg p-3">
                            <p className="text-[10px] text-muted-foreground mb-2">
                              Proximos turnos
                            </p>
                            <div className="space-y-2">
                              {[
                                {
                                  time: "10:00",
                                  name: "Juan P.",
                                  service: "Corte + Barba",
                                  status: "bg-emerald-400",
                                },
                                {
                                  time: "10:45",
                                  name: "Martin R.",
                                  service: "Corte clasico",
                                  status: "bg-primary",
                                },
                                {
                                  time: "11:30",
                                  name: "Diego L.",
                                  service: "Barba",
                                  status: "bg-amber-400",
                                },
                              ].map((appt) => (
                                <div
                                  key={appt.time}
                                  className="flex items-center gap-2 text-[11px]"
                                >
                                  <span className="text-muted-foreground w-10 shrink-0">
                                    {appt.time}
                                  </span>
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full ${appt.status} shrink-0`}
                                  />
                                  <span className="font-medium truncate">
                                    {appt.name}
                                  </span>
                                  <span className="text-muted-foreground truncate ml-auto">
                                    {appt.service}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="glass rounded-lg p-3">
                            <p className="text-[10px] text-muted-foreground mb-2">
                              Actividad reciente
                            </p>
                            <div className="space-y-2">
                              {[
                                {
                                  icon: MessageSquare,
                                  text: "WhatsApp enviado a Juan P.",
                                  time: "Hace 2m",
                                },
                                {
                                  icon: CreditCard,
                                  text: "Pago recibido $4.500",
                                  time: "Hace 15m",
                                },
                                {
                                  icon: Calendar,
                                  text: "Nueva reserva de Sofia A.",
                                  time: "Hace 1h",
                                },
                              ].map((activity, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-[11px]"
                                >
                                  <activity.icon className="w-3 h-3 text-muted-foreground shrink-0" />
                                  <span className="truncate">
                                    {activity.text}
                                  </span>
                                  <span className="text-muted-foreground shrink-0 ml-auto">
                                    {activity.time}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating notification toasts */}
                <div className="hero-toast absolute right-2 -top-3 glass rounded-lg p-3 flex items-center gap-2 text-xs opacity-0 shadow-lg z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="whitespace-nowrap">WhatsApp enviado</span>
                </div>
                <div className="hero-toast absolute right-2 -bottom-3 glass rounded-lg p-3 flex items-center gap-2 text-xs opacity-0 shadow-lg z-10">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <CreditCard className="w-3 h-3 text-primary" />
                  </div>
                  <span className="whitespace-nowrap">Pago recibido $4.500</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          3. SOCIAL PROOF BAR
          ════════════════════════════════════════ */}
      <section className="py-8 overflow-hidden border-y border-border/50">
        <div
          ref={marqueeRef}
          className="flex items-center gap-12 whitespace-nowrap"
        >
          {[...businessTypes, ...businessTypes].map((biz, i) => (
            <div
              key={`${biz.label}-${i}`}
              className="flex items-center gap-2 text-muted-foreground shrink-0"
            >
              <biz.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{biz.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          4. FEATURES (Bento Grid)
          ════════════════════════════════════════ */}
      <section
        id="features"
        ref={featuresRef}
        className="py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
              Todo lo que necesitas,{" "}
              <GradientText as="span">nada que no</GradientText>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Herramientas pensadas para negocios de servicios argentinos.
              Simple, potente, hermoso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <GlassCard
                key={feature.title}
                className={`feature-card opacity-0 ${
                  feature.size === "large" ? "md:col-span-2" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Mini visual demos for hero cards */}
                {feature.title === "Turnos Inteligentes" && (
                  <div className="flex items-center gap-3 mt-2">
                    {[
                      { step: "1", label: "Elegir servicio" },
                      { step: "2", label: "Seleccionar hora" },
                      { step: "3", label: "Confirmado" },
                    ].map((s, i) => (
                      <div key={s.step} className="flex items-center gap-2">
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              i === 2
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {i === 2 ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              s.step
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {s.label}
                          </span>
                        </div>
                        {i < 2 && (
                          <div className="w-6 h-px bg-border mb-4" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {feature.title === "Pagos Integrados" && (
                  <div className="glass rounded-lg p-3 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        Corte + Barba
                      </span>
                      <span className="text-sm font-bold">$4.500</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <Check className="w-3 h-3" />
                      <span>Pago aprobado</span>
                    </div>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          5. HOW IT WORKS
          ════════════════════════════════════════ */}
      <section
        id="how-it-works"
        ref={howItWorksRef}
        className="py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
              Activo en{" "}
              <GradientText as="span">3 simples pasos</GradientText>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              De cero a recibir reservas en menos de lo que tarda un cafe.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-[15%] right-[15%] h-0.5 -translate-y-1/2">
              <div className="step-line h-full brand-gradient origin-left" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="step-card opacity-0 text-center relative"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass mb-6 relative z-10 bg-background">
                    <span className="text-3xl font-heading font-bold brand-text">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-heading font-semibold mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          6. PRODUCT TOUR
          ════════════════════════════════════════ */}
      <section ref={productTourRef} className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
              Conoce tu nuevo{" "}
              <GradientText as="span">panel de control</GradientText>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar tu negocio, en un solo lugar.
            </p>
          </div>

          <div className="product-tour-container opacity-0">
            <Tabs defaultValue="turnos" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 mb-8">
                {dashboardTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="glass rounded-2xl p-4 sm:p-6">
                <TabsContent value="turnos" className="mt-0">
                  <div className="flex gap-4">
                    <div className="hidden sm:flex flex-col w-40 gap-1">
                      {[
                        "Hoy",
                        "Esta semana",
                        "Pendientes",
                        "Completados",
                      ].map((item, i) => (
                        <div
                          key={item}
                          className={`px-3 py-2 rounded-lg text-xs ${
                            i === 0
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 space-y-3">
                      {[
                        {
                          time: "09:00",
                          client: "Ana Martinez",
                          service: "Corte y Color",
                          pro: "Maria G.",
                          status: "Confirmado",
                          color: "text-emerald-400",
                        },
                        {
                          time: "10:30",
                          client: "Pedro Sanchez",
                          service: "Barba Premium",
                          pro: "Lucas F.",
                          status: "Pendiente",
                          color: "text-amber-400",
                        },
                        {
                          time: "11:00",
                          client: "Laura Diaz",
                          service: "Manos + Pies",
                          pro: "Sofia A.",
                          status: "Confirmado",
                          color: "text-emerald-400",
                        },
                        {
                          time: "12:00",
                          client: "Diego Lopez",
                          service: "Corte Clasico",
                          pro: "Lucas F.",
                          status: "Pago recibido",
                          color: "text-primary",
                        },
                      ].map((t) => (
                        <div
                          key={t.time}
                          className="flex items-center gap-4 glass rounded-lg p-3 text-sm"
                        >
                          <span className="text-muted-foreground w-12 shrink-0 text-xs">
                            {t.time}
                          </span>
                          <span className="font-medium flex-1 truncate">
                            {t.client}
                          </span>
                          <span className="text-muted-foreground hidden sm:block truncate flex-1">
                            {t.service}
                          </span>
                          <span className="text-muted-foreground hidden lg:block truncate w-20">
                            {t.pro}
                          </span>
                          <span className={`text-xs ${t.color} shrink-0`}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Ingresos", value: "$485.200", change: "+12%" },
                      {
                        label: "Turnos totales",
                        value: "342",
                        change: "+8%",
                      },
                      {
                        label: "Nuevos clientes",
                        value: "47",
                        change: "+23%",
                      },
                      {
                        label: "Tasa ocupacion",
                        value: "91%",
                        change: "+5%",
                      },
                    ].map((kpi) => (
                      <div key={kpi.label} className="glass rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-1">
                          {kpi.label}
                        </p>
                        <p className="text-xl font-heading font-bold">
                          {kpi.value}
                        </p>
                        <p className="text-xs text-emerald-400">{kpi.change}</p>
                      </div>
                    ))}
                  </div>
                  <div className="glass rounded-lg p-4 h-40 flex items-center justify-center text-muted-foreground text-sm">
                    <BarChart3 className="w-5 h-5 mr-2" /> Grafico de ingresos
                    mensuales
                  </div>
                </TabsContent>

                <TabsContent value="clientes" className="mt-0">
                  <div className="space-y-3">
                    {[
                      {
                        name: "Ana Martinez",
                        visits: 24,
                        spent: "$86.400",
                        last: "Hace 2 dias",
                      },
                      {
                        name: "Pedro Sanchez",
                        visits: 18,
                        spent: "$54.000",
                        last: "Hace 1 semana",
                      },
                      {
                        name: "Laura Diaz",
                        visits: 31,
                        spent: "$124.000",
                        last: "Ayer",
                      },
                      {
                        name: "Diego Lopez",
                        visits: 12,
                        spent: "$36.000",
                        last: "Hoy",
                      },
                    ].map((c) => (
                      <div
                        key={c.name}
                        className="flex items-center gap-4 glass rounded-lg p-3"
                      >
                        <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {c.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.visits} visitas · {c.last}
                          </p>
                        </div>
                        <span className="text-sm font-heading font-bold shrink-0">
                          {c.spent}
                        </span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="pagos" className="mt-0">
                  <div className="space-y-3">
                    {[
                      {
                        client: "Ana Martinez",
                        amount: "$4.500",
                        method: "MercadoPago",
                        status: "Acreditado",
                        color: "text-emerald-400",
                      },
                      {
                        client: "Pedro Sanchez",
                        amount: "$2.000",
                        method: "Sena MP",
                        status: "Acreditado",
                        color: "text-emerald-400",
                      },
                      {
                        client: "Laura Diaz",
                        amount: "$6.800",
                        method: "MercadoPago",
                        status: "Pendiente",
                        color: "text-amber-400",
                      },
                      {
                        client: "Diego Lopez",
                        amount: "$3.500",
                        method: "Efectivo",
                        status: "Registrado",
                        color: "text-primary",
                      },
                    ].map((p) => (
                      <div
                        key={p.client}
                        className="flex items-center gap-4 glass rounded-lg p-3 text-sm"
                      >
                        <span className="font-medium flex-1 truncate">
                          {p.client}
                        </span>
                        <span className="font-heading font-bold">
                          {p.amount}
                        </span>
                        <span className="text-muted-foreground hidden sm:block text-xs w-24">
                          {p.method}
                        </span>
                        <span className={`text-xs ${p.color} shrink-0`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          7. INTEGRATIONS
          ════════════════════════════════════════ */}
      <section
        id="integrations"
        ref={integrationsRef}
        className="py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
              Se integra con lo que{" "}
              <GradientText as="span">ya usas</GradientText>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Conecta tus herramientas favoritas sin complicaciones.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {integrations.map((integration) => (
              <GlassCard
                key={integration.name}
                className="integration-card opacity-0 relative"
              >
                {integration.comingSoon && (
                  <Badge
                    variant="secondary"
                    className="absolute top-4 right-4 text-[10px]"
                  >
                    Proximamente
                  </Badge>
                )}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    integration.comingSoon
                      ? "bg-muted"
                      : "brand-gradient"
                  }`}
                >
                  <integration.icon
                    className={`w-5 h-5 ${
                      integration.comingSoon
                        ? "text-muted-foreground"
                        : "text-white"
                    }`}
                  />
                </div>
                <h3 className="font-heading font-semibold mb-1">
                  {integration.name}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {integration.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          8. TESTIMONIALS
          ════════════════════════════════════════ */}
      <section
        id="testimonials"
        ref={testimonialsRef}
        className="py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
              Lo que dicen{" "}
              <GradientText as="span">nuestros clientes</GradientText>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Negocios reales en Argentina que transformaron su dia a dia con
              Aktivo.
            </p>
          </div>

          {/* Featured testimonial */}
          <div className="testimonial-featured opacity-0 max-w-3xl mx-auto mb-16">
            <GlassCard className="p-8 sm:p-12 text-center relative">
              <div className="text-6xl font-heading brand-text leading-none mb-4">
                &ldquo;
              </div>
              <p className="text-lg sm:text-xl leading-relaxed text-foreground/90 mb-6">
                {featuredTestimonial.text}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <TrendingUp className="w-4 h-4" />
                {featuredTestimonial.highlight}
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full brand-gradient flex items-center justify-center text-white font-bold">
                  {featuredTestimonial.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="text-left">
                  <p className="font-medium">{featuredTestimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {featuredTestimonial.business} &middot;{" "}
                    {featuredTestimonial.city}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Marquee rows */}
          <div className="space-y-6 overflow-hidden">
            {/* Row 1: scrolls left */}
            <div className="overflow-hidden">
              <div
                ref={testimonialRow1Ref}
                className="flex gap-6"
                style={{ width: "fit-content" }}
              >
                {[...row1, ...row1].map((t, i) => (
                  <div
                    key={`r1-${i}`}
                    className="glass rounded-xl p-6 w-80 shrink-0"
                  >
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star
                          key={j}
                          className="w-3 h-3 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90 mb-4">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-bold">
                        {t.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {t.business}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2: scrolls right */}
            <div className="overflow-hidden">
              <div
                ref={testimonialRow2Ref}
                className="flex gap-6"
                style={{ width: "fit-content" }}
              >
                {[...row2, ...row2].map((t, i) => (
                  <div
                    key={`r2-${i}`}
                    className="glass rounded-xl p-6 w-80 shrink-0"
                  >
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star
                          key={j}
                          className="w-3 h-3 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90 mb-4">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-bold">
                        {t.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {t.business}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          9. STATS
          ════════════════════════════════════════ */}
      <section
        ref={statsRef}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-grid-pattern relative"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/3 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="stat-item opacity-0 text-center"
              >
                <p className="text-4xl sm:text-5xl font-heading font-bold brand-text">
                  <span
                    className="stat-number"
                    data-target={stat.value}
                  >
                    0
                  </span>
                  {stat.suffix}
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          10. PRICING
          ════════════════════════════════════════ */}
      <section
        id="pricing"
        ref={pricingRef}
        className="py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
              Planes que{" "}
              <GradientText as="span">escalan con vos</GradientText>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Empeza gratis, crece cuando quieras.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 glass rounded-full p-1">
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  billingPeriod === "monthly"
                    ? "brand-gradient text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setBillingPeriod("monthly")}
              >
                Mensual
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                  billingPeriod === "annual"
                    ? "brand-gradient text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setBillingPeriod("annual")}
              >
                Anual
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-emerald-500/20 text-emerald-400 border-0"
                >
                  2 meses gratis
                </Badge>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`pricing-card opacity-0 glass rounded-2xl p-8 relative ${
                  plan.popular
                    ? "ring-2 ring-primary pricing-popular"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full brand-gradient text-white text-xs font-medium">
                    Mas popular
                  </div>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      plan.popular ? "brand-gradient" : "bg-muted"
                    }`}
                  >
                    <plan.icon
                      className={`w-5 h-5 ${
                        plan.popular ? "text-white" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <h3 className="font-heading text-xl font-bold">
                    {plan.name}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  {plan.description}
                </p>
                <div className="mt-6 mb-8">
                  <span className="text-4xl font-heading font-bold">
                    {billingPeriod === "annual"
                      ? plan.annualPrice
                      : plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/registrarse" className="block">
                  <Button
                    className={`w-full rounded-xl ${
                      plan.popular
                        ? "brand-gradient text-white border-0"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.price === "Gratis"
                      ? "Empezar gratis"
                      : "Elegir plan"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8 flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" /> Sin comisiones
              ocultas
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" /> Soporte en espanol
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" /> Cancela cuando
              quieras
            </span>
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          11. FAQ
          ════════════════════════════════════════ */}
      <section
        id="faq"
        ref={faqRef}
        className="py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
              Preguntas{" "}
              <GradientText as="span">frecuentes</GradientText>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Todo lo que necesitas saber para empezar.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="faq-item opacity-0 glass rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() =>
                    setOpenFaq(openFaq === idx ? null : idx)
                  }
                >
                  <span className="font-medium text-sm pr-4">
                    {faq.question}
                  </span>
                  <div
                    className={`shrink-0 transition-transform duration-300 ${
                      openFaq === idx ? "rotate-45" : ""
                    }`}
                  >
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === idx ? "max-h-40" : "max-h-0"
                  }`}
                >
                  <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          12. FINAL CTA
          ════════════════════════════════════════ */}
      <section ref={ctaRef} className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="final-cta opacity-0 glass rounded-3xl p-12 sm:p-16 relative overflow-hidden text-center bg-grid-pattern">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/15 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
                Listo para dejar de{" "}
                <GradientText as="span">perder clientes?</GradientText>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Unite a los 2.000+ negocios que ya estan creciendo con Aktivo.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Link href="/registrarse">
                  <MagneticButton className="brand-gradient text-white px-8 py-3 rounded-xl font-medium text-lg inline-flex items-center gap-2 glow-primary">
                    Empezar gratis
                    <ArrowRight className="w-5 h-5" />
                  </MagneticButton>
                </Link>
                <a href="mailto:hola@aktivo.com">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl"
                  >
                    Hablar con el equipo
                  </Button>
                </a>
              </div>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" /> Sin tarjeta
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" /> Soporte espanol
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" /> Cancela cuando
                  quieras
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          13. FOOTER
          ════════════════════════════════════════ */}
      <footer
        ref={footerRef}
        className="border-t border-border py-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="footer-content opacity-0 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand column */}
            <div>
              <AktivoLogo size="sm" className="mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                La plataforma todo-en-uno para negocios de servicios en
                Argentina. Turnos, pagos, CRM y mas.
              </p>
            </div>

            {/* Link columns */}
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h4 className="font-heading font-semibold text-sm mb-4">
                  {group.title}
                </h4>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Separator className="mb-8" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Aktivo. Todos los derechos
              reservados.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Hecho con <Heart className="w-3 h-3 text-red-400 fill-red-400" />{" "}
              en Argentina
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
