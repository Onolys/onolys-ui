// @vitest-environment node
import { execFileSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve, join, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { build } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { chromium, type Browser, type Page } from "playwright";
import { tokens } from "../tokens/tokens";

const root = fileURLToPath(new URL("../../", import.meta.url));
it("maps shared typography values without custom property self references", async () => {
  const css = await readFile(resolve(root, "src/styles/theme.css"), "utf8");
  for (const name of ["font-sans", "leading-body", "leading-heading", "text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl"] as const) {
    expect(css).toContain(`--${name}: ${tokens.light[name]};`);
  }
  expect(css).not.toMatch(/--([\w-]+):\s*var\(--\1\)/);
});

describe("built Tailwind theme in Chromium", () => {
  let fixture: string;
  let server: Server;
  let browser: Browser;
  let page: Page;
  let origin: string;
  const fontRequests: string[] = [];

  beforeAll(async () => {
    execFileSync("npm", ["run", "build"], { cwd: root, stdio: "pipe" });
    fixture = await mkdtemp(resolve(root, ".styles-fixture-"));
    await writeFile(join(fixture, "index.html"), `<!doctype html>
      <html lang="en"><head><meta charset="utf-8"><title>Theme test</title>
      <link rel="stylesheet" href="./style.css"></head><body>
      <button class="bg-primary text-primary-foreground p-4 text-xl font-sans leading-body h-header px-gutter rounded-md shadow-sm">Focus me</button>
      <div id="accent" class="bg-accent">Accent</div>
      <div id="motion">Motion</div></body></html>`);
    await writeFile(join(fixture, "style.css"), `
      @import "${resolve(root, "node_modules/tailwindcss/index.css")}";
      @import "${resolve(root, "dist/theme.css")}";
      @source inline("bg-primary bg-accent text-primary-foreground p-4 text-xl font-sans leading-body h-header px-gutter rounded-md shadow-sm");
      #motion { transition: opacity 2s; animation: fade 2s infinite; }
      @keyframes fade { to { opacity: .5; } }
    `);
    await build({
      configFile: false, root: fixture, logLevel: "error", plugins: [tailwindcss()],
      build: { assetsInlineLimit: 0 },
    });
    server = createServer(async (request, response) => {
      const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
      const path = resolve(fixture, "dist", `.${pathname === "/" ? "/index.html" : pathname}`);
      if (!path.startsWith(resolve(fixture, "dist") + sep)) {
        response.writeHead(403).end(); return;
      }
      try {
        const contentTypes: Record<string, string> = { ".html": "text/html", ".css": "text/css", ".woff2": "font/woff2", ".js": "text/javascript" };
        const body = await readFile(path);
        const contentType = contentTypes[extname(path)];
        response.writeHead(200, { "Content-Type": contentType ?? "application/octet-stream" });
        response.end(body);
      } catch {
        response.writeHead(404).end();
      }
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No fixture port");
    origin = `http://127.0.0.1:${address.port}`;
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    page = await browser.newPage({ colorScheme: "light", reducedMotion: "reduce" });
    page.on("request", (request) => {
      if (request.resourceType() === "font") fontRequests.push(request.url());
    });
    await page.goto(origin);
    await page.evaluate(() => document.fonts.ready);
  }, 30_000);

  afterAll(async () => {
    await browser?.close();
    if (server) await new Promise<void>((done) => server.close(() => done()));
    if (fixture) await rm(fixture, { recursive: true, force: true });
  });

  it("resolves semantic colors, typography, and layout in light", async () => {
    const styles = await page.locator("button").evaluate((button) => {
      const style = getComputedStyle(button);
      const root = getComputedStyle(document.documentElement);
      return {
        background: style.backgroundColor, color: style.color, fontSize: style.fontSize,
        fontFamily: style.fontFamily, lineHeight: style.lineHeight, height: style.height,
        padding: style.paddingLeft, radius: style.borderRadius,
        border: root.getPropertyValue("--border").trim(),
      };
    });
    expect(styles).toMatchObject({
      background: "rgb(11, 95, 90)", color: "rgb(255, 255, 255)", fontSize: "24px",
      lineHeight: "38.4px", height: "64px", padding: "16px", radius: "6px",
      border: "#6e7e7c",
    });
    expect(styles.fontFamily).toContain("Inter Variable");
    expect(await page.locator("#accent").evaluate((element) => getComputedStyle(element).backgroundColor))
      .toBe("rgb(237, 241, 241)");
  });

  it("loads the actual bundled font from the fixture origin", async () => {
    expect(fontRequests.length).toBeGreaterThan(0);
    expect(fontRequests.every((url) => url.startsWith(`${origin}/`) && url.endsWith(".woff2"))).toBe(true);
    expect(await page.evaluate(() => document.fonts.check('16px "Inter Variable"'))).toBe(true);
    for (const cssPath of ["src/styles/fonts.css", "dist/fonts.css"]) {
      const css = await readFile(resolve(root, cssPath), "utf8");
      const fontUrl = css.match(/url\(['"]?([^)'"\s]+)['"]?\)/)?.[1];
      expect(fontUrl).toMatch(/^\.\.?\//);
      expect(await readFile(resolve(root, cssPath, "..", fontUrl!)))
        .toEqual(await readFile(resolve(root, "fonts/inter-latin-wght-normal.woff2")));
    }
    const font = await readFile(resolve(root, "fonts/inter-latin-wght-normal.woff2"));
    expect(font.subarray(0, 4).toString()).toBe("wOF2");
    const license = await readFile(resolve(root, "fonts/OFL.txt"), "utf8");
    expect(license).toContain("SIL OPEN FONT LICENSE Version 1.1");
  });

  it("applies a visible 3px focus ring, reduced motion, and CSS scroll locking", async () => {
    await page.keyboard.press("Tab");
    // Even the reduced 0.01ms color transition settles on a later browser frame.
    await expect.poll(() => page.locator("button").evaluate((button) => {
      const styles = getComputedStyle(button);
      return { width: styles.outlineWidth, style: styles.outlineStyle, color: styles.outlineColor };
    })).toEqual({ width: "3px", style: "solid", color: "rgb(11, 95, 90)" });
    const transition = await page.locator("#motion").evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(transition)).toBeLessThanOrEqual(0.00001);
    const animation = await page.locator("#motion").evaluate((element) => getComputedStyle(element).animationDuration);
    expect(Number.parseFloat(animation)).toBeLessThanOrEqual(0.00001);
    await page.evaluate(() => document.body.setAttribute("data-scroll-locked", ""));
    expect(await page.locator("body").evaluate((body) => getComputedStyle(body).overflow)).toBe("hidden");
    await page.evaluate(() => document.body.removeAttribute("data-scroll-locked"));
    expect(await page.locator("body").evaluate((body) => getComputedStyle(body).overflow)).not.toBe("hidden");
  });

  it("switches semantic utilities automatically under dark media", async () => {
    await page.emulateMedia({ colorScheme: "dark" });
    await expect.poll(() => page.locator("button").evaluate((button) => getComputedStyle(button).backgroundColor))
      .toBe("rgb(95, 196, 184)");
    expect(await page.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor))
      .toBe("rgb(15, 21, 20)");
  });
});
