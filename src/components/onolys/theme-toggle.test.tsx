import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY as STORAGE_KEY } from "../../constants";
import { ThemeToggle } from "./theme-toggle";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("ThemeToggle", () => {
  it("starts on System with a label naming state and next action", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: "Theme: System (click for Light)" });
    expect(btn).toHaveAttribute("title", "Theme: System (click for Light)");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("cycles System -> Light -> Dark -> System, applying and persisting each", async () => {
    render(<ThemeToggle />);
    const click = () => userEvent.click(screen.getByRole("button"));
    const icons: string[] = [];
    icons.push(screen.getByRole("button").innerHTML);
    await click();
    expect(screen.getByRole("button", { name: "Theme: Light (click for Dark)" })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    icons.push(screen.getByRole("button").innerHTML);
    await click();
    expect(screen.getByRole("button", { name: "Theme: Dark (click for System)" })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    icons.push(screen.getByRole("button").innerHTML);
    await click();
    expect(screen.getByRole("button", { name: "Theme: System (click for Light)" })).toBeInTheDocument();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(new Set(icons).size).toBe(3);
  });

  it("restores a stored choice on mount", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Theme: Dark (click for System)" })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("still works when storage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button"));
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
