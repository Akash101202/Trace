"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

// The theme lives on <html data-theme>, set before hydration by the
// init script in layout.js. React subscribes to that attribute.
const ThemeContext = createContext(null);

function readTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(onChange) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark");

  const toggleTheme = useCallback(() => {
    const next = readTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("trace-theme", next);
    } catch {
      // The theme still applies for this session without storage.
    }
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTraceTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTraceTheme must be used inside ThemeProvider.");
  return context;
}
