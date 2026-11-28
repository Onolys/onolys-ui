import { THEME_STORAGE_KEY } from "../constants";

/** Theme preference: System (no override), Light or Dark. Stored in localStorage; applied as `data-theme` on <html>. */
export type Theme = "system" | "light" | "dark";

const ORDER: Theme[] = ["system", "light", "dark"];

export function nextTheme(t: Theme): Theme {
  return ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]!;
}

export function readTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function saveTheme(t: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, t);
  } catch {
    /* storage blocked: the choice just won't persist */
  }
}

export function applyTheme(t: Theme): void {
  const el = document.documentElement;
  if (t === "system") delete el.dataset.theme;
  else el.dataset.theme = t;
}
