"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The card every dead end in the flow renders: a mark, a sentence that says what
 * happened, and the ways out.
 *
 * These states existed in the API and nowhere in the interface. A 409 came back
 * as `code: "SLOT_TAKEN"` and turned into a sonner toast that faded while the
 * customer sat on a form holding a slot that no longer existed; a rejected
 * MercadoPago payment redirected to `?error=payment`, which nothing read.
 */
export function BookingStatusCard({
  tone,
  icon,
  illustration,
  title,
  children,
  actions,
  footnote,
  className,
}: {
  tone?: "warning" | "danger";
  icon?: React.ReactNode;
  illustration?: string;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  footnote?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-[26px] text-center shadow-[0_16px_40px_-20px_rgba(9,9,11,0.25)]",
        className
      )}
    >
      {illustration && (
        <Image
          src={illustration}
          alt=""
          width={220}
          height={110}
          className="mx-auto mb-3 h-[110px] w-auto"
        />
      )}
      {icon && (
        <span
          className={cn(
            "mx-auto mb-3.5 flex size-[52px] items-center justify-center rounded-full text-[22px]",
            tone === "danger"
              ? "bg-danger-muted text-danger-foreground"
              : "bg-warning-muted text-warning-foreground"
          )}
          aria-hidden
        >
          {icon}
        </span>
      )}

      <h2 className="mb-1.5 text-[17px] font-bold tracking-[-0.02em]">{title}</h2>
      {children && (
        <div className="mx-auto mb-[18px] max-w-[320px] text-[12.5px] leading-[1.6] text-muted-foreground">
          {children}
        </div>
      )}
      {actions && <div className="flex flex-wrap justify-center gap-2.5">{actions}</div>}
      {footnote && <div className="mt-3.5 text-[11px] text-faint">{footnote}</div>}
    </div>
  );
}
