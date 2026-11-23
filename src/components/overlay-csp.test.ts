// @vitest-environment node
import { execFileSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { build } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { chromium, type Browser } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));

describe("built controls under style-src self", () => {
  let fixture: string;
  let browser: Browser;
  let server: Server;
  let origin: string;

  beforeAll(async () => {
    fixture = await mkdtemp(resolve(root, ".overlay-fixture-"));
    // Keep this build isolated from other tests that build the normal dist directory.
    execFileSync(
      resolve(root, "node_modules/.bin/tsup"),
      ["--out-dir", join(fixture, "package")],
      { cwd: root, stdio: "pipe" },
    );
    await writeFile(
      join(fixture, "index.html"),
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Control CSP test</title></head><body><div id="root"></div><script type="module" src="./main.jsx"></script></body></html>',
    );
    await writeFile(
      join(fixture, "main.jsx"),
      `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { Select as RawSelect } from 'radix-ui';
      import { Button, Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription,
        AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription,
        AlertDialogCancel, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
        Select } from '${join(fixture, "package/index.js")}';
      import './style.css';
      createRoot(document.getElementById('root')).render(<>
        <Dialog><DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger><DialogContent><DialogTitle>Preferences</DialogTitle><DialogDescription>Update settings.</DialogDescription><Button>First</Button><Button>Last</Button></DialogContent></Dialog>
        <AlertDialog><AlertDialogTrigger asChild><Button>Open alert</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogTitle>Confirm removal</AlertDialogTitle><AlertDialogDescription>Remove this item?</AlertDialogDescription><AlertDialogCancel>Cancel</AlertDialogCancel></AlertDialogContent></AlertDialog>
        <DropdownMenu><DropdownMenuTrigger asChild><Button>Open menu</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>Profile</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        <Select aria-label="Language" defaultValue="en"><option value="en">English</option><option value="fr">French</option></Select>
        <RawSelect.Root><RawSelect.Trigger aria-label="Raw Radix select"><RawSelect.Value placeholder="Choose raw" /></RawSelect.Trigger><RawSelect.Portal><RawSelect.Content><RawSelect.Viewport><RawSelect.Item value="one"><RawSelect.ItemText>One</RawSelect.ItemText></RawSelect.Item></RawSelect.Viewport></RawSelect.Content></RawSelect.Portal></RawSelect.Root>
      </>);
    `,
    );
    await writeFile(
      join(fixture, "style.css"),
      `@import "${resolve(root, "node_modules/tailwindcss/index.css")}"; @import "${resolve(root, "src/styles/theme.css")}"; @source "${join(fixture, "package")}";`,
    );
    await build({
      configFile: false,
      root: fixture,
      logLevel: "silent",
      plugins: [tailwindcss()],
      build: { assetsInlineLimit: 0 },
    });
    server = createServer(async (request, response) => {
      const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
      const path = resolve(
        fixture,
        "dist",
        `.${pathname === "/" ? "/index.html" : pathname}`,
      );
      if (!path.startsWith(resolve(fixture, "dist") + sep)) {
        response.writeHead(403).end();
        return;
      }
      try {
        const mime: Record<string, string> = {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".woff2": "font/woff2",
        };
        const body = await readFile(path);
        response.writeHead(200, {
          "Content-Type": mime[extname(path)] ?? "application/octet-stream",
          "Content-Security-Policy":
            "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'",
        });
        response.end(body);
      } catch {
        response.writeHead(404).end();
      }
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing fixture port");
    origin = `http://127.0.0.1:${address.port}`;
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  }, 30_000);

  afterAll(async () => {
    await browser?.close();
    if (server) await new Promise<void>((done) => server.close(() => done()));
    if (fixture) await rm(fixture, { recursive: true, force: true });
  });

  it("proves unmodified Radix Select violates the enforced stylesheet policy", async () => {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      const captured: string[] = [];
      Object.assign(window, { cspViolations: captured });
      document.addEventListener("securitypolicyviolation", (event) =>
        captured.push(`${event.effectiveDirective}: ${event.blockedURI}`),
      );
    });
    await page.goto(origin);
    await page.getByRole("combobox", { name: "Raw Radix select" }).click();
    await expect
      .poll(() =>
        page.evaluate(() => Reflect.get(window, "cspViolations") as string[]),
      )
      .toContain("style-src-elem: inline");
    expect(await page.locator("style").count()).toBeGreaterThan(0);
    await page.close();
  });

  it("opens the library Select without injecting a stylesheet or violating CSP", async () => {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      const captured: string[] = [];
      Object.assign(window, { cspViolations: captured });
      document.addEventListener("securitypolicyviolation", (event) =>
        captured.push(`${event.effectiveDirective}: ${event.blockedURI}`),
      );
    });
    await page.goto(origin);
    await page.getByRole("combobox", { name: "Language" }).click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await expect
      .poll(() => page.getByRole("combobox", { name: "Language" }).inputValue())
      .toBe("fr");
    expect(
      await page.evaluate(
        () => Reflect.get(window, "cspViolations") as string[],
      ),
    ).toEqual([]);
    expect(await page.locator("style").count()).toBe(0);
    await page.close();
  });
  for (const colorScheme of ["light", "dark"] as const) {
    it(`${colorScheme}: keeps Radix dialogs and menus functional with zero CSP violations`, async () => {
      const page = await browser.newPage({
        colorScheme,
        reducedMotion: "reduce",
      });
      await page.addInitScript(() => {
        const captured: string[] = [];
        Object.assign(window, { cspViolations: captured });
        document.addEventListener("securitypolicyviolation", (event) =>
          captured.push(`${event.effectiveDirective}: ${event.blockedURI}`),
        );
      });
      await page.goto(origin);
      await page.getByRole("button", { name: "Open dialog" }).click();
      await expect
        .poll(() => page.getByRole("dialog", { name: "Preferences" }).count())
        .toBe(1);
      expect(
        await page.locator("body").getAttribute("data-scroll-locked"),
      ).toBe("1");
      expect(
        await page
          .locator("body")
          .evaluate((body) => getComputedStyle(body).overflow),
      ).toBe("hidden");
      await page.getByRole("button", { name: "First", exact: true }).focus();
      await page.keyboard.press("Shift+Tab");
      expect(
        await page
          .getByRole("button", { name: "Close", exact: true })
          .evaluate((element) => element === document.activeElement),
      ).toBe(true);
      await page.keyboard.press("Tab");
      expect(
        await page
          .getByRole("button", { name: "First", exact: true })
          .evaluate((element) => element === document.activeElement),
      ).toBe(true);
      await page
        .locator('[data-slot="dialog-overlay"]')
        .click({ position: { x: 5, y: 5 } });
      await expect.poll(() => page.getByRole("dialog").count()).toBe(0);
      expect(
        await page.locator("body").getAttribute("data-scroll-locked"),
      ).toBe(null);
      await page.getByRole("button", { name: "Open alert" }).click();
      await expect
        .poll(() =>
          page.getByRole("alertdialog", { name: "Confirm removal" }).count(),
        )
        .toBe(1);
      expect(
        await page
          .getByRole("button", { name: "Cancel", exact: true })
          .evaluate((element) => element === document.activeElement),
      ).toBe(true);
      await page
        .locator('[data-slot="alert-dialog-overlay"]')
        .click({ position: { x: 5, y: 5 } });
      expect(await page.getByRole("alertdialog").count()).toBe(1);
      await page.keyboard.press("Escape");
      await expect.poll(() => page.getByRole("alertdialog").count()).toBe(0);
      expect(
        await page.locator("body").getAttribute("data-scroll-locked"),
      ).toBe(null);
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect.poll(() => page.getByRole("menu").count()).toBe(1);
      expect(
        await page.locator("body").getAttribute("data-scroll-locked"),
      ).toBe(null);
      await page.getByRole("menuitem", { name: "Profile" }).click();
      await expect.poll(() => page.getByRole("menu").count()).toBe(0);
      expect(await page.locator("style").count()).toBe(0);
      expect(
        await page.evaluate(
          () => Reflect.get(window, "cspViolations") as string[],
        ),
      ).toEqual([]);
      await page.close();
    });
  }
});
