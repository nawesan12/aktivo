"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useBookingStore } from "@/stores/booking-store";
import { MagneticButton } from "@/components/premium/magnetic-button";
import {
  Check,
  Calendar,
  Clock,
  User,
  Scissors,
  MessageCircle,
  Mail,
  ArrowRight,
} from "lucide-react";

function formatPrice(price: number): string {
  return price.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

export function ConfirmationContent({ slug }: { slug: string }) {
  const store = useBookingStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Read store values before we reset
  const booking = {
    serviceName: store.serviceName,
    servicePrice: store.servicePrice,
    serviceDuration: store.serviceDuration,
    staffName: store.staffName,
    date: store.date,
    time: store.time,
    guestName: store.guestName,
    guestPhone: store.guestPhone,
    guestEmail: store.guestEmail,
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Circle scales in
      tl.fromTo(
        ".confirm-circle",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
      );

      // Checkmark draws in (simulate with scale)
      tl.fromTo(
        ".confirm-check",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" },
        "-=0.2"
      );

      // Glow pulse
      tl.fromTo(
        ".confirm-circle",
        { boxShadow: "0 0 0 0 rgba(99, 102, 241, 0)" },
        {
          boxShadow: "0 0 40px 10px rgba(99, 102, 241, 0.3)",
          duration: 0.6,
          yoyo: true,
          repeat: 1,
        },
        "-=0.3"
      );

      // Title reveals
      tl.fromTo(
        ".confirm-title",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5 },
        "-=0.6"
      );

      // Subtitle reveals
      tl.fromTo(
        ".confirm-subtitle",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4 },
        "-=0.3"
      );

      // Card fades up
      tl.fromTo(
        ".confirm-card",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6 },
        "-=0.2"
      );

      // Notification badges
      tl.fromTo(
        ".confirm-notif",
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.1 },
        "-=0.3"
      );

      // CTA button
      tl.fromTo(
        ".confirm-cta",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4 },
        "-=0.2"
      );
    }, containerRef.current);

    // Reset store after animation starts
    const resetTimer = setTimeout(() => {
      store.reset();
    }, 1000);

    return () => {
      ctx.revert();
      clearTimeout(resetTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        {/* Success animation */}
        <div className="confirm-circle w-20 h-20 rounded-full brand-gradient flex items-center justify-center mx-auto mb-6 opacity-0">
          <Check className="confirm-check w-10 h-10 text-white opacity-0" />
        </div>

        <h1 className="confirm-title opacity-0 text-2xl sm:text-3xl font-heading font-bold mb-2">
          Turno confirmado!
        </h1>
        <p className="confirm-subtitle opacity-0 text-muted-foreground mb-8">
          Tu turno fue reservado exitosamente
        </p>

        {/* Booking details card */}
        {booking.serviceName && (
          <div className="confirm-card opacity-0 glass rounded-xl p-6 mb-6 text-left space-y-3">
            <div className="flex items-center gap-3">
              <Scissors className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{booking.serviceName}</p>
                <p className="text-xs text-muted-foreground">
                  {booking.servicePrice ? formatPrice(booking.servicePrice) : ""}{" "}
                  {booking.serviceDuration ? `· ${formatDuration(booking.serviceDuration)}` : ""}
                </p>
              </div>
            </div>

            <div className="border-t border-border" />

            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm">{booking.staffName}</p>
            </div>

            <div className="border-t border-border" />

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm">{booking.date}</p>
              <Clock className="w-4 h-4 text-primary shrink-0 ml-auto" />
              <p className="text-sm font-heading font-bold text-primary">{booking.time}</p>
            </div>
          </div>
        )}

        {/* Notification status */}
        <div className="space-y-2 mb-8">
          {booking.guestPhone && (
            <div className="confirm-notif opacity-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              Confirmacion enviada por WhatsApp
            </div>
          )}
          {booking.guestEmail && (
            <div className="confirm-notif opacity-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4 text-primary" />
              Confirmacion enviada por email
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="confirm-cta opacity-0">
          <Link href={`/${slug}/reservar`}>
            <MagneticButton className="brand-gradient text-white px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2 glow-primary cursor-pointer">
              Reservar otro turno
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
