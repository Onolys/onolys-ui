// src/tokens/tokens.ts
var shared = {
  radius: "0.5rem",
  "space-1": "0.25rem",
  "space-2": "0.5rem",
  "space-3": "0.75rem",
  "space-4": "1rem",
  "space-6": "1.5rem",
  "space-8": "2rem",
  "space-12": "3rem",
  "space-16": "4rem",
  "space-24": "6rem",
  "header-h": "64px",
  gutter: "16px",
  "font-sans": "'Inter Variable', sans-serif",
  "text-xs": "0.75rem",
  "text-sm": "0.875rem",
  "text-base": "1rem",
  "text-lg": "1.125rem",
  "text-xl": "1.5rem",
  "text-2xl": "2rem",
  "text-3xl": "3rem",
  "text-4xl": "4rem",
  "leading-body": "1.6",
  "leading-heading": "1.15"
};
var light = {
  background: "#ffffff",
  foreground: "#171c1c",
  card: "#ffffff",
  "card-foreground": "#171c1c",
  popover: "#ffffff",
  "popover-foreground": "#171c1c",
  primary: "#0b5f5a",
  "primary-foreground": "#ffffff",
  secondary: "#edf1f1",
  "secondary-foreground": "#171c1c",
  muted: "#f7f9f9",
  "muted-foreground": "#536160",
  accent: "#edf1f1",
  "accent-foreground": "#171c1c",
  destructive: "#8a3030",
  "destructive-foreground": "#ffffff",
  success: "#166534",
  warning: "#854d0e",
  // Accessible boundary color: these boundaries convey control affordances.
  border: "#6e7e7c",
  input: "#6e7e7c",
  ring: "#0b5f5a",
  "score-good": "#175b42",
  "score-good-bg": "#e5f4ec",
  "score-fair": "#71500a",
  "score-fair-bg": "#fff3d6",
  "score-low": "#8a3030",
  "score-low-bg": "#fbe9e9",
  "tone-hero": "#ffffff",
  "tone-features": "#e4f2ef",
  "tone-evaluates": "#eef2f7",
  "tone-compare": "#e8f6ee",
  "tone-team": "#f8f2e5",
  "tone-benefits": "#f1f4fa",
  "tone-footer": "#0a3b38",
  "footer-bg": "#0a3b38",
  "footer-text": "#dcebe9",
  "footer-link": "#9fe3d8",
  "footer-muted": "#9fcfc8",
  "verdict-supported": "#176d30",
  "verdict-partially-supported": "#9c4708",
  "verdict-contradicted": "#c62828",
  "verdict-insufficient-evidence": "#59616f",
  "verdict-out-of-scope": "#59616f",
  "role-supporting": "#176d30",
  "role-contradicting": "#c62828",
  "role-qualifying": "#9c4708",
  selected: "#e5e7eb",
  "shadow-sm": "0 1px 2px rgb(23 28 28 / 0.08)",
  shadow: "0 4px 12px rgb(23 28 28 / 0.12)",
  "shadow-lg": "0 12px 32px rgb(23 28 28 / 0.18)",
  ...shared
};
var dark = {
  ...light,
  background: "#0f1514",
  foreground: "#e6efed",
  card: "#151d1c",
  "card-foreground": "#e6efed",
  popover: "#151d1c",
  "popover-foreground": "#e6efed",
  primary: "#5fc4b8",
  "primary-foreground": "#0f1514",
  secondary: "#23322f",
  "secondary-foreground": "#e6efed",
  muted: "#1b2725",
  "muted-foreground": "#a9bdb8",
  accent: "#23322f",
  "accent-foreground": "#e6efed",
  destructive: "#f29b9b",
  "destructive-foreground": "#241111",
  success: "#6ee79a",
  warning: "#fbbf24",
  border: "#78928d",
  input: "#78928d",
  ring: "#5fc4b8",
  "score-good": "#9bdfb9",
  "score-good-bg": "#143528",
  "score-fair": "#f4d88a",
  "score-fair-bg": "#3c3016",
  "score-low": "#f2aaaa",
  "score-low-bg": "#3f2020",
  "tone-hero": "#0f1514",
  "tone-features": "#152923",
  "tone-evaluates": "#1b2430",
  "tone-compare": "#172c20",
  "tone-team": "#2b271b",
  "tone-benefits": "#202635",
  "verdict-supported": "#8edda5",
  "verdict-partially-supported": "#f3c27d",
  "verdict-contradicted": "#f29b9b",
  "verdict-insufficient-evidence": "#bac2cf",
  "verdict-out-of-scope": "#aeb8c7",
  "role-supporting": "#8edda5",
  "role-contradicting": "#f29b9b",
  "role-qualifying": "#f3c27d",
  selected: "#233e3a",
  "shadow-sm": "0 1px 2px rgb(0 0 0 / 0.24)",
  shadow: "0 4px 12px rgb(0 0 0 / 0.32)",
  "shadow-lg": "0 12px 32px rgb(0 0 0 / 0.48)"
};
var tokens = { light, dark };
var contentSurfaces = [
  "background",
  "card",
  "popover",
  "secondary",
  "muted",
  "accent",
  "selected"
];
var toneSurfaces = [
  "tone-hero",
  "tone-features",
  "tone-evaluates",
  "tone-compare",
  "tone-team",
  "tone-benefits"
];
var evidenceColors = [
  "verdict-supported",
  "verdict-partially-supported",
  "verdict-contradicted",
  "verdict-insufficient-evidence",
  "verdict-out-of-scope",
  "role-supporting",
  "role-contradicting",
  "role-qualifying"
];
var contrastPairs = [
  ...[...contentSurfaces, ...toneSurfaces].flatMap((background) => ["foreground", "muted-foreground", "primary"].map((foreground) => ({ foreground, background, usage: "text" }))),
  ...[
    ["card-foreground", "card"],
    ["popover-foreground", "popover"],
    ["primary-foreground", "primary"],
    ["secondary-foreground", "secondary"],
    ["accent-foreground", "accent"],
    ["destructive-foreground", "destructive"],
    ["score-good", "score-good-bg"],
    ["score-fair", "score-fair-bg"],
    ["score-low", "score-low-bg"],
    ["destructive", "background"],
    ["destructive", "card"],
    ["success", "background"],
    ["success", "card"],
    ["warning", "background"],
    ["warning", "card"]
  ].map(([foreground, background]) => ({ foreground, background, usage: "text" })),
  ...evidenceColors.flatMap((foreground) => contentSurfaces.map((background) => ({ foreground, background, usage: "text" }))),
  ...["footer-bg", "tone-footer"].flatMap((background) => ["footer-text", "footer-link", "footer-muted"].map((foreground) => ({ foreground, background, usage: "text" }))),
  ...[...contentSurfaces, ...toneSurfaces].flatMap((background) => ["border", "input", "ring"].map((foreground) => ({ foreground, background, usage: "ui" })))
];
function renderTokensCss() {
  const declarations = (theme, indent) => Object.entries(tokens[theme]).map(([name, value]) => `${indent}--${name}: ${value};`).join("\n");
  return `/* Generated from tokens.ts by npm run tokens:generate. Do not edit. */
:root {
${declarations("light", "  ")}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${declarations("dark", "    ")}
  }
}

:root[data-theme="dark"] {
${declarations("dark", "  ")}
}
`;
}
export {
  contrastPairs,
  renderTokensCss,
  tokens
};
//# sourceMappingURL=tokens.js.map