// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastPairs, renderTokensCss, tokens, type Theme } from "./tokens";

const themes: Theme[] = ["light", "dark"];

function luminance(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Invalid opaque sRGB color: ${hex}`);
  const channels = hex.slice(1).match(/../g)!.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function violations(palette: Record<string, string>): string[] {
  return contrastPairs.flatMap(({ foreground, background, usage }) => {
    const ratio = contrast(palette[foreground], palette[background]);
    const minimum = usage === "text" ? 4.5 : 3;
    return ratio < minimum
      ? [`${foreground} on ${background}: ${ratio.toFixed(3)} < ${minimum} (${usage})`]
      : [];
  });
}

describe("generated token CSS", () => {
  it("matches the TypeScript source byte for byte", () => {
    const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
    expect(css).toBe(renderTokensCss());
    expect(css).toMatch(/^\/\* Generated/);
    expect(css).toContain("@media (prefers-color-scheme: dark) {");
    expect(css).toContain(':root:not([data-theme="light"]) {');
    expect(css).toContain(':root[data-theme="dark"] {');
    expect(css).not.toContain(".dark");
  });

  it("declares every token exactly once in each theme with the source value", () => {
    const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
    const blocks = [...css.matchAll(/:root[^{]*\{([^}]+)\}/g)];
    expect(blocks).toHaveLength(3);
    [...themes, "dark" as Theme].forEach((theme, index) => {
      const declarations = [...blocks[index][1].matchAll(/--([\w-]+):\s*([^;]+);/g)]
        .map(([, name, value]) => [name, value]);
      expect(declarations).toHaveLength(Object.keys(tokens[theme]).length);
      expect(Object.fromEntries(declarations)).toEqual(tokens[theme]);
    });
    expect(Object.keys(tokens.light)).toEqual(Object.keys(tokens.dark));
  });

  it("supports a manual data-theme override with identical dark values", () => {
    const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
    const media = css.match(/@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\) \{([^}]+)\}/);
    const forced = css.match(/\n:root\[data-theme="dark"\] \{([^}]+)\}/);
    expect(media).not.toBeNull();
    expect(forced).not.toBeNull();
    const norm = (body: string) => [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, n, v]) => `${n}:${v}`);
    expect(norm(media![1])).toEqual(norm(forced![1]));
    expect(norm(forced![1]).length).toBeGreaterThan(0);
    expect(css).not.toContain(':root[data-theme="light"] {');
  });

  it("sets color-scheme per data-theme and keeps light dark by default", () => {
    const base = readFileSync(new URL("../styles/base.css", import.meta.url), "utf8");
    expect(base).toContain("color-scheme: light dark;");
    expect(base).toMatch(/:root\[data-theme="light"\]\s*\{\s*color-scheme: light;/);
    expect(base).toMatch(/:root\[data-theme="dark"\]\s*\{\s*color-scheme: dark;/);
  });

  it("preserves the light brand and score palette", () => {
    expect(tokens.light).toMatchObject({
      primary: "#0b5f5a",
      "score-good": "#175b42", "score-good-bg": "#e5f4ec",
      "score-fair": "#71500a", "score-fair-bg": "#fff3d6",
      "score-low": "#8a3030", "score-low-bg": "#fbe9e9",
      "footer-bg": "#0a3b38", "footer-text": "#dcebe9",
      "footer-link": "#9fe3d8", "footer-muted": "#9fcfc8",
      radius: "0.5rem",
    });
  });
});

describe("WCAG AA token contrast", () => {
  it("uses the WCAG relative luminance formula without rounding the pass threshold", () => {
    expect(contrast("#000000", "#ffffff")).toBe(21);
    expect(contrast("#ffffff", "#ffffff")).toBe(1);
    expect(contrast("#0b5f5a", "#ffffff")).toBeCloseTo(7.5033, 4);
  });

  for (const theme of themes) {
    it(`${theme}: all documented text and UI pairs meet AA`, () => {
      expect(violations(tokens[theme])).toEqual([]);
    });

    it(`${theme}: rejects a deliberately bad foreground token`, () => {
      const bad = { ...tokens[theme], foreground: tokens[theme].background };
      expect(violations(bad)).toContain("foreground on background: 1.000 < 4.5 (text)");
    });
  }

  it("rejects a deliberately invisible UI boundary at the 3:1 threshold", () => {
    expect(violations({ ...tokens.light, border: tokens.light.background }))
      .toContain("border on background: 1.000 < 3 (ui)");
  });

  it("covers every color token and all foreground/background relationships", () => {
    const covered = new Set<string>(contrastPairs.flatMap((pair) => [pair.foreground, pair.background]));
    for (const [name, value] of Object.entries(tokens.light)) {
      if (/^#[0-9a-f]{6}$/i.test(value)) expect(covered.has(name), name).toBe(true);
    }
    expect(new Set(contrastPairs.map((pair) => `${pair.foreground}/${pair.background}`)).size)
      .toBe(contrastPairs.length);
    expect(contrastPairs.some((pair) => pair.usage === "ui")).toBe(true);
  });
});
