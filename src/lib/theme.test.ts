import { afterEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY as STORAGE_KEY } from "../constants";
import { applyTheme, nextTheme, readTheme, saveTheme } from "./theme";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("theme", () => {
  it("cycles system -> light -> dark -> system", () => {
    expect(nextTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("system");
  });

  it("defaults to system when nothing or junk is stored", () => {
    expect(readTheme()).toBe("system");
    localStorage.setItem(STORAGE_KEY, "purple");
    expect(readTheme()).toBe("system");
  });

  it("persists and reads back the choice", () => {
    saveTheme("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    expect(readTheme()).toBe("dark");
  });

  it("sets data-theme for light/dark and removes it for system", () => {
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    applyTheme("system");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("survives localStorage throwing", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readTheme()).toBe("system");
    expect(() => saveTheme("dark")).not.toThrow();
  });
});
