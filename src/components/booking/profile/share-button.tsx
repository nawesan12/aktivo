"use client";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
/**
 * The whole point of a business having a link is passing it around, and there
 * was no way to do it from the page. Uses the native share sheet where there is
 * one — which on a phone is what people expect — and falls back to copying.
 */
export function ShareButton({ name, className }: { name: string; className?: string }) {
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
      } catch {
        // The person dismissed the sheet. Nothing to report.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.error("No pudimos copiar el link");
    }
  }
  return (
    <button type="button" onClick={share} className={className}>
      <Share2 className="size-3.5" aria-hidden />
      Compartir
    </button>
  );
}
