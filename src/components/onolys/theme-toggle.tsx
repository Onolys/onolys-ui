import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { applyTheme, nextTheme, readTheme, saveTheme, type Theme } from "../../lib/theme";

const LABEL: Record<Theme, string> = { system: "System", light: "Light", dark: "Dark" };
const ICON = { system: Monitor, light: Sun, dark: Moon } as const;

/** Icon button cycling System -> Light -> Dark -> System; persists and sets `data-theme` on <html>. */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = readTheme();
    applyTheme(t);
    return t;
  });
  const next = nextTheme(theme);
  const label = `Theme: ${LABEL[theme]} (click for ${LABEL[next]})`;
  const Icon = ICON[theme];
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex size-8 items-center justify-center rounded-md text-current opacity-80 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className ?? ""}`}
      onClick={() => {
        applyTheme(next);
        saveTheme(next);
        setTheme(next);
      }}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}
