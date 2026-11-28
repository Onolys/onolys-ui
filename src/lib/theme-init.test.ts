import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY } from "../constants";

const template = readFileSync(join(process.cwd(), "scripts/theme-init.template.js"), "utf8");
const renderThemeInit = (key: string) => template.replace("__THEME_STORAGE_KEY__", JSON.stringify(key));

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("theme-init.js", () => {
  it("is generated from the single storage key constant", () => {
    const script = renderThemeInit(THEME_STORAGE_KEY);
    expect(template).toContain("__THEME_STORAGE_KEY__");
    expect(script).toContain(JSON.stringify(THEME_STORAGE_KEY));
    expect(script).not.toContain("__THEME_STORAGE_KEY__");
    const constants = readFileSync(join(process.cwd(), "src/constants.ts"), "utf8");
    expect(constants).toContain(`THEME_STORAGE_KEY = "onolys-theme"`);
  });

  it("applies a stored light/dark override and ignores junk", () => {
    const run = () => new Function(renderThemeInit(THEME_STORAGE_KEY))();
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    run();
    expect(document.documentElement.dataset.theme).toBe("dark");
    delete document.documentElement.dataset.theme;
    localStorage.setItem(THEME_STORAGE_KEY, "purple");
    run();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});
