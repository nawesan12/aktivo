"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Phone,
  MapPin,
  MessageCircle,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/premium/magnetic-button";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface BusinessProfileProps {
  business: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    primaryColor: string | null;
    accentColor: string | null;
  };
  categories: Array<{
    id: string;
    name: string;
    services: Array<{
      id: string;
      name: string;
      description: string | null;
      duration: number;
      price: number;
    }>;
  }>;
  staff: Array<{
    id: string;
    name: string;
    image: string | null;
    bio: string | null;
    specialty: string | null;
    workingHours: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  }>;
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function formatPrice(price: number): string {
  return price.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function BusinessProfile({ business, categories, staff }: BusinessProfileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const staffRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Hero entrance sequence
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .fromTo(".bp-hero-logo", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.7 })
        .fromTo(".bp-hero-name", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.3")
        .fromTo(".bp-hero-desc", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.3")
        .fromTo(".bp-hero-cta", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2")
        .fromTo(".bp-hero-scroll", { opacity: 0 }, { opacity: 1, duration: 0.4 }, "-=0.1");

      // Quick info slides up
      gsap.fromTo(
        ".bp-quickinfo",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          scrollTrigger: { trigger: ".bp-quickinfo", start: "top 90%" },
        }
      );

      // Service cards stagger
      if (servicesRef.current) {
        gsap.fromTo(
          ".bp-service-card",
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            scrollTrigger: { trigger: servicesRef.current, start: "top 80%" },
          }
        );
      }

      // Staff cards stagger
      if (staffRef.current) {
        gsap.fromTo(
          ".bp-staff-card",
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            scrollTrigger: { trigger: staffRef.current, start: "top 80%" },
          }
        );
      }

      // Hours fade in
      gsap.fromTo(
        ".bp-hours",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          scrollTrigger: { trigger: ".bp-hours", start: "top 85%" },
        }
      );
    }, containerRef.current);

    return () => ctx.revert();
  }, []);

  // Gather working hours from the first staff member (or aggregate)
  const hoursSource = staff[0]?.workingHours ?? [];
  const hoursByDay = new Map(hoursSource.map((wh) => [wh.dayOfWeek, wh]));

  const quickInfoItems = [
    business.phone && {
      icon: Phone,
      label: business.phone,
      href: `tel:${business.phone.replace(/\s/g, "")}`,
    },
    business.address && {
      icon: MapPin,
      label: [business.address, business.city, business.province].filter(Boolean).join(", "),
      href: `https://maps.google.com/?q=${encodeURIComponent([business.address, business.city, business.province].filter(Boolean).join(", "))}`,
    },
    business.whatsapp && {
      icon: MessageCircle,
      label: "WhatsApp",
      href: `https://wa.me/${business.whatsapp.replace(/\D/g, "")}`,
    },
  ].filter(Boolean) as Array<{ icon: typeof Phone; label: string; href: string }>;

  const allServices = categories.flatMap((c) => c.services);

  return (
    <div ref={containerRef} className="min-h-screen pb-24 md:pb-8">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        {/* Background */}
        {business.coverUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${business.coverUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 brand-gradient opacity-[0.12]" />
            <div className="absolute inset-0 bg-grid-pattern" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
          </>
        )}

        {/* Ambient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
            style={{
              background: business.primaryColor || "#6366f1",
              top: "10%",
              left: "-10%",
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-15"
            style={{
              background: business.accentColor || "#22d3ee",
              bottom: "0%",
              right: "-5%",
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 pt-24 pb-16 sm:pt-32 sm:pb-20 text-center">
          {/* Logo / Avatar */}
          <div className="bp-hero-logo opacity-0 mb-6 inline-block">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-white/10 shadow-2xl"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl brand-gradient flex items-center justify-center text-white text-2xl sm:text-3xl font-heading font-bold shadow-2xl ring-2 ring-white/10">
                {getInitials(business.name)}
              </div>
            )}
          </div>

          <h1 className="bp-hero-name opacity-0 text-3xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight mb-4">
            {business.name}
          </h1>

          {business.description && (
            <p className="bp-hero-desc opacity-0 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
              {business.description}
            </p>
          )}

          <div className="bp-hero-cta opacity-0">
            <Link href={`/${business.slug}/reservar`}>
              <MagneticButton className="brand-gradient text-white px-8 py-3.5 rounded-xl font-medium text-lg inline-flex items-center gap-2.5 glow-primary cursor-pointer">
                <Sparkles className="w-5 h-5" />
                Reservar turno
                <ArrowRight className="w-5 h-5" />
              </MagneticButton>
            </Link>
          </div>

          {/* Scroll hint */}
          <div className="bp-hero-scroll opacity-0 mt-12 flex flex-col items-center gap-1 text-muted-foreground/50">
            <span className="text-xs">Conoce mas</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ─── Quick Info Bar ─── */}
      {quickInfoItems.length > 0 && (
        <div className="bp-quickinfo opacity-0 max-w-4xl mx-auto px-4 -mt-4 mb-12">
          <div className="glass rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
              {quickInfoItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.label.length > 20 ? item.label.slice(0, 20) + "..." : item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Services ─── */}
      {allServices.length > 0 && (
        <section ref={servicesRef} className="max-w-4xl mx-auto px-4 mb-16">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-8">
            Servicios
          </h2>

          {categories
            .filter((c) => c.services.length > 0)
            .map((category) => (
              <div key={category.id} className="mb-8 last:mb-0">
                {categories.length > 1 && (
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full brand-gradient" />
                    {category.name}
                  </h3>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {category.services.map((service) => (
                    <div
                      key={service.id}
                      className="bp-service-card opacity-0 glass rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-heading font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                            {service.name}
                          </h4>
                          {service.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDuration(service.duration)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-lg font-heading font-bold brand-text">
                            {formatPrice(service.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </section>
      )}

      {/* ─── Staff / Equipo ─── */}
      {staff.length > 0 && (
        <section ref={staffRef} className="max-w-4xl mx-auto px-4 mb-16">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-8">
            Nuestro equipo
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {staff.map((member) => (
              <div
                key={member.id}
                className="bp-staff-card opacity-0 glass rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-14 h-14 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl brand-gradient flex items-center justify-center text-white font-heading font-bold text-lg shrink-0 ring-1 ring-white/10">
                      {getInitials(member.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading font-semibold text-base">{member.name}</h4>
                    {member.specialty && (
                      <span className="inline-block mt-1 mb-2 px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
                        {member.specialty}
                      </span>
                    )}
                    {member.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {member.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Horarios ─── */}
      {hoursSource.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 mb-16">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-8">
            Horarios
          </h2>

          <div className="bp-hours opacity-0 glass rounded-xl p-5 sm:p-6 max-w-md">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const wh = hoursByDay.get(day);
                const isToday = new Date().getDay() === day;
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex items-center justify-between py-1.5 text-sm",
                      isToday && "text-primary font-medium"
                    )}
                  >
                    <span className={cn(!isToday && "text-muted-foreground")}>
                      {DAY_NAMES[day]}
                      {isToday && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider opacity-70">hoy</span>
                      )}
                    </span>
                    <span className={cn(!wh && "text-muted-foreground/50")}>
                      {wh ? `${wh.startTime} - ${wh.endTime}` : "Cerrado"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Floating Mobile CTA ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden p-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <Link
          href={`/${business.slug}/reservar`}
          className="block w-full brand-gradient text-white text-center py-3.5 rounded-xl font-medium text-base glow-primary"
        >
          Reservar turno
        </Link>
      </div>
    </div>
  );
}
