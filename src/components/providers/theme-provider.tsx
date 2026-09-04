"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/*
  Bumped from "jiku-theme".

  The old provider wrote the theme to storage on every render, not only when
  somebody chose one — and the old default was dark. So every person who ever
  opened the app carries a stored "dark" that was never a decision, and after
  the redesign flipped the default they would all land in the dark theme and
  never see the light one. A new key ignores that artifact once; from here on
  what is stored is only ever an actual choice.
*/
export const THEME_STORAGE_KEY = "jiku-theme-2";

/**
 * The class the provider toggles is `dark`, not `light`.
 *
 * It used to be the other way round — dark was the default in `:root` and a
 * `.light` class opted out — which meant `@custom-variant dark (&:is(.dark *))`
 * in globals.css keyed off a class nothing ever added, so every `dark:` utility
 * shadcn ships was dead. Light is the default now and this adds `.dark` on top,
 * which is both what the design calls for and what those utilities expect.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Matches what the blocking script in the document head already applied, so
  // the first client render agrees with the markup the browser painted.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Intentional: localStorage doesn't exist on the server, so reading it in
    // the initializer would make the server and client markup disagree. The
    // stored theme can only be applied after hydration.
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === "dark" || stored === "light") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
