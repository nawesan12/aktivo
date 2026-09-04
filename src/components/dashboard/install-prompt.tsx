"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "jiku:install-dismissed";

/**
 * The invitation to install the app.
 *
 * Everything a PWA needs was already here — manifest, service worker,
 * registration — and nothing ever offered it: the browser only shows its own
 * install affordance where it feels like it, buried in a menu. An owner who
 * would rather tap an icon than find a tab was never told they could.
 *
 * Shown only in the panel, and only once: the person who dismisses it has
 * answered.
 */
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    function onPrompt(e: Event) {
      // Holding onto it is the whole point: the browser fires this once, and
      // the prompt can only be opened later from a real user gesture.
      e.preventDefault();
      setEvent(e as InstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    // Installed from the browser's own menu instead: nothing left to offer.
    window.addEventListener("appinstalled", () => setEvent(null));

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!event) return null;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setEvent(null);
  }

  async function install() {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    // Either way this offer is spent: the browser will not let it be reused.
    localStorage.setItem(DISMISSED_KEY, "1");
    setEvent(null);
  }

  return (
    <div className="glass rounded-xl p-4 flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Download className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Instalá Jiku en este dispositivo</p>
        <p className="text-xs text-muted-foreground">
          Se abre como una app, sin buscar la pestaña.
        </p>
      </div>
      <button
        onClick={install}
        className="h-9 px-4 rounded-lg brand-gradient text-white text-sm font-medium shrink-0"
      >
        Instalar
      </button>
      <button
        onClick={dismiss}
        aria-label="No instalar"
        className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
