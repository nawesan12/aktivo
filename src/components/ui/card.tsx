import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * The card is the panel's unit of everything, so the variants are the ones the
 * design actually distinguishes:
 *
 *   default   white surface, hairline border, soft shadow
 *   featured  the one card per screen that carries the answer — jade border and
 *             a jade-tinted shadow instead of the neutral one
 *   flat      no shadow, for cards nested inside another card
 *   inset     a filled block on the page background, no border
 *
 * `padding` is separate because the same surface appears at three densities: a
 * KPI tile, a list row and a full section all use `Card`.
 */
const cardVariants = cva(
  "flex flex-col text-card-foreground transition-[border-color,box-shadow,transform] duration-200",
  {
    variants: {
      variant: {
        default: "rounded-xl border border-border bg-card shadow-card",
        featured: "rounded-2xl border-2 border-primary bg-card shadow-jade",
        flat: "rounded-xl border border-border bg-card",
        inset: "rounded-xl bg-muted",
      },
      padding: {
        none: "",
        sm: "gap-3 p-4",
        md: "gap-4 p-[18px]",
        lg: "gap-5 p-6",
      },
      interactive: {
        true: "cursor-pointer hover:border-faint hover:shadow-card-lift",
        false: "",
      },
    },
    defaultVariants: { variant: "default", padding: "md", interactive: false },
  }
)

function Card({
  className,
  variant,
  padding,
  interactive,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-variant={variant ?? "default"}
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-sm leading-none font-semibold tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center [.border-t]:pt-4", className)}
      {...props}
    />
  )
}

export {
  Card,
  cardVariants,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
