// @vitest-environment node
import { execFileSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { build } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { chromium, type Browser, type Page } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
interface Target {
  name: string;
  width: number;
  height: number;
}
const variants = [
  "default",
  "destructive",
  "outline",
  "secondary",
  "ghost",
  "link",
];
const sizes = [
  "default",
  "xs",
  "sm",
  "lg",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
];
const expectedTargets: Record<string, string[]> = {
  base: [
    ...variants.map((name) => `button-${name}`),
    ...sizes.map((name) => `size-${name}`),
    "button-link",
    "input",
    "file-input",
    "textarea",
    "select",
    "checkbox",
    "label",
    "tab-one",
    "tab-two",
    "vertical-tab-one",
    "vertical-tab-two",
    "badge-link",
    "badge-button",
    "dialog-trigger",
    "dialog-composed-trigger",
    "alert-trigger",
    "alert-composed-trigger",
    "menu-trigger",
    "menu-composed-trigger",
    "tooltip-trigger",
    "tooltip-composed-trigger",
    "header-brand",
    "header-nav",
    "header-account",
    "footer-link",
    "skip-default",
    "skip-short",
  ],
  dialog: [
    "dialog-close",
    "dialog-composed-close",
    "dialog-icon-close",
    "dialog-footer-close",
  ],
  alert: [
    "alert-action",
    "alert-action-small",
    "alert-cancel",
    "alert-cancel-small",
  ],
  menu: [
    "menu-item",
    "menu-destructive",
    "menu-checkbox",
    "menu-radio-one",
    "menu-radio-two",
    "submenu-trigger",
    "submenu-item",
  ],
};

function assertMinimum(targets: Target[]) {
  expect(
    targets
      .filter(({ width, height }) => width < 44 || height < 44)
      .map(({ name, width, height }) => `${name}: ${width} × ${height}px`),
  ).toEqual([]);
}

async function measure(page: Page): Promise<Target[]> {
  // Skip links are intentionally visually hidden until focused; measure their active hit area.
  return page.locator("[data-target]").evaluateAll((elements) =>
    elements.map((element) => {
      if (element.matches('[data-slot="skip-link"]'))
        (element as HTMLElement).focus();
      const { width, height } = element.getBoundingClientRect();
      return { name: element.getAttribute("data-target")!, width, height };
    }),
  );
}

describe("interactive targets in built Tailwind CSS", () => {
  let fixture: string;
  let browser: Browser;
  let server: Server;
  let origin: string;

  beforeAll(async () => {
    fixture = await mkdtemp(resolve(root, ".targets-fixture-"));
    execFileSync(
      resolve(root, "node_modules/.bin/tsup"),
      ["--out-dir", join(fixture, "package")],
      { cwd: root, stdio: "pipe" },
    );
    await writeFile(
      join(fixture, "index.html"),
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Interactive target test</title></head><body><div id="root"></div><script type="module" src="./main.jsx"></script></body></html>',
    );
    await writeFile(
      join(fixture, "main.jsx"),
      `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import * as UI from '${join(fixture, "package/index.js")}';
      import './style.css';
      const scene = new URLSearchParams(location.search).get('scene') || 'base';
      const tiny = new URLSearchParams(location.search).has('tiny');
      function BaseControls() { return <>
        <UI.SkipLink data-target="skip-default" />
        <UI.SkipLink data-target="skip-short" aria-label="Skip to content">?</UI.SkipLink>
        <UI.AppHeader brand={<a href="#main" data-target="header-brand" aria-label="Home">O</a>} navigation={<a href="#main" data-target="header-nav" aria-label="Help">?</a>} accountMenu={<button data-target="header-account" aria-label="Account">A</button>} />
        <UI.Page><div className="flex flex-wrap items-start gap-4">
          {${JSON.stringify(variants)}.map(variant => <UI.Button key={variant} variant={variant} data-target={'button-'+variant} aria-label={variant+' action'}>x</UI.Button>)}
          {${JSON.stringify(sizes)}.map(size => <UI.Button key={size} size={size} data-target={'size-'+size} aria-label={size+' action'}>x</UI.Button>)}
          <UI.Button asChild><a href="#main" data-target="button-link" aria-label="Action link">x</a></UI.Button>
          <div className="w-56"><UI.Input data-target="input" aria-label="Name" /></div>
          <div className="w-56"><UI.Input type="file" data-target="file-input" aria-label="File" /></div>
          <div className="w-56"><UI.Textarea data-target="textarea" aria-label="Notes" /></div>
          <UI.Select data-target="select" aria-label="Language"><option value="en">EN</option></UI.Select>
          <UI.Checkbox data-target="checkbox" id="accept" /><UI.Label data-target="label" htmlFor="accept">OK</UI.Label>
          <UI.Tabs defaultValue="one"><UI.TabsList aria-label="Tabs"><UI.TabsTrigger data-target="tab-one" value="one">1</UI.TabsTrigger><UI.TabsTrigger data-target="tab-two" value="two">2</UI.TabsTrigger></UI.TabsList></UI.Tabs>
          <UI.Tabs defaultValue="one" orientation="vertical"><UI.TabsList variant="line" aria-label="Vertical tabs"><UI.TabsTrigger data-target="vertical-tab-one" value="one">1</UI.TabsTrigger><UI.TabsTrigger data-target="vertical-tab-two" value="two">2</UI.TabsTrigger></UI.TabsList></UI.Tabs>
          <UI.Badge asChild variant="link"><a href="#main" data-target="badge-link" aria-label="Badge link">x</a></UI.Badge>
          <UI.Badge asChild><button data-target="badge-button" aria-label="Badge action">x</button></UI.Badge>
          <UI.Dialog><UI.DialogTrigger data-target="dialog-trigger" aria-label="Dialog trigger">x</UI.DialogTrigger></UI.Dialog>
          <UI.Dialog><UI.DialogTrigger asChild><button data-target="dialog-composed-trigger" aria-label="Composed dialog trigger">x</button></UI.DialogTrigger></UI.Dialog>
          <UI.AlertDialog><UI.AlertDialogTrigger data-target="alert-trigger" aria-label="Alert trigger">x</UI.AlertDialogTrigger></UI.AlertDialog>
          <UI.AlertDialog><UI.AlertDialogTrigger asChild><button data-target="alert-composed-trigger" aria-label="Composed alert trigger">x</button></UI.AlertDialogTrigger></UI.AlertDialog>
          <UI.DropdownMenu><UI.DropdownMenuTrigger data-target="menu-trigger" aria-label="Menu trigger">x</UI.DropdownMenuTrigger></UI.DropdownMenu>
          <UI.DropdownMenu><UI.DropdownMenuTrigger asChild><button data-target="menu-composed-trigger" aria-label="Composed menu trigger">x</button></UI.DropdownMenuTrigger></UI.DropdownMenu>
          <UI.TooltipProvider><UI.Tooltip><UI.TooltipTrigger data-target="tooltip-trigger" aria-label="Tooltip trigger">x</UI.TooltipTrigger></UI.Tooltip><UI.Tooltip><UI.TooltipTrigger asChild><button data-target="tooltip-composed-trigger" aria-label="Composed tooltip trigger">x</button></UI.TooltipTrigger></UI.Tooltip></UI.TooltipProvider>
          {tiny && <button data-target="injected-tiny-control" className="h-4 w-4" aria-label="Bad target">x</button>}
        </div></UI.Page>
        <UI.Footer links={<a href="#main" data-target="footer-link" aria-label="Footer help">?</a>} />
      </> }
      function DialogControls() { return <UI.Dialog defaultOpen><UI.DialogContent><UI.DialogTitle>Dialog</UI.DialogTitle><UI.DialogDescription>Dialog controls.</UI.DialogDescription><UI.DialogClose data-target="dialog-close">Done</UI.DialogClose><UI.DialogClose asChild><button data-target="dialog-composed-close">Done</button></UI.DialogClose><UI.DialogFooter showCloseButton /></UI.DialogContent></UI.Dialog> }
      function AlertControls() { return <UI.AlertDialog defaultOpen><UI.AlertDialogContent><UI.AlertDialogTitle>Confirm</UI.AlertDialogTitle><UI.AlertDialogDescription>Alert controls.</UI.AlertDialogDescription><UI.AlertDialogAction data-target="alert-action">Yes</UI.AlertDialogAction><UI.AlertDialogAction size="sm" data-target="alert-action-small">Yes</UI.AlertDialogAction><UI.AlertDialogCancel data-target="alert-cancel">No</UI.AlertDialogCancel><UI.AlertDialogCancel size="sm" data-target="alert-cancel-small">No</UI.AlertDialogCancel></UI.AlertDialogContent></UI.AlertDialog> }
      function MenuControls() { return <UI.DropdownMenu defaultOpen><UI.DropdownMenuTrigger>Menu</UI.DropdownMenuTrigger><UI.DropdownMenuContent><UI.DropdownMenuItem data-target="menu-item">Item</UI.DropdownMenuItem><UI.DropdownMenuItem data-target="menu-destructive" variant="destructive">Remove</UI.DropdownMenuItem><UI.DropdownMenuCheckboxItem data-target="menu-checkbox">Checked</UI.DropdownMenuCheckboxItem><UI.DropdownMenuRadioGroup value="one"><UI.DropdownMenuRadioItem data-target="menu-radio-one" value="one">One</UI.DropdownMenuRadioItem><UI.DropdownMenuRadioItem data-target="menu-radio-two" value="two">Two</UI.DropdownMenuRadioItem></UI.DropdownMenuRadioGroup><UI.DropdownMenuSub><UI.DropdownMenuSubTrigger data-target="submenu-trigger">More</UI.DropdownMenuSubTrigger><UI.DropdownMenuSubContent><UI.DropdownMenuItem data-target="submenu-item">Nested</UI.DropdownMenuItem></UI.DropdownMenuSubContent></UI.DropdownMenuSub></UI.DropdownMenuContent></UI.DropdownMenu> }
      createRoot(document.getElementById('root')).render(scene === 'dialog' ? <DialogControls /> : scene === 'alert' ? <AlertControls /> : scene === 'menu' ? <MenuControls /> : <BaseControls />);
    `,
    );
    await writeFile(
      join(fixture, "style.css"),
      `@import "${resolve(root, "node_modules/tailwindcss/index.css")}"; @import "${resolve(root, "src/styles/theme.css")}"; @source "${join(fixture, "package")}"; @source "${join(fixture, "main.jsx")}";`,
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
        const content = await readFile(path);
        const mime: Record<string, string> = {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".woff2": "font/woff2",
        };
        response.writeHead(200, {
          "Content-Type": mime[extname(path)] ?? "application/octet-stream",
        });
        response.end(content);
      } catch {
        response.writeHead(404).end();
      }
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("No fixture port");
    origin = `http://127.0.0.1:${address.port}`;
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  }, 30_000);

  afterAll(async () => {
    await browser?.close();
    if (server) await new Promise<void>((done) => server.close(() => done()));
    if (fixture) await rm(fixture, { recursive: true, force: true });
  });

  for (const colorScheme of ["light", "dark"] as const) {
    for (const scene of Object.keys(expectedTargets)) {
      it(`${colorScheme}: ${scene} controls have at least 44px width and height`, async () => {
        const page = await browser.newPage({
          colorScheme,
          reducedMotion: "reduce",
        });
        await page.goto(`${origin}/?scene=${scene}`);
        await page.locator("[data-target]").first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        if (scene === "menu") {
          await page.locator('[data-target="submenu-trigger"]').focus();
          await page.keyboard.press("ArrowRight");
          await page.locator('[data-target="submenu-item"]').waitFor();
        }
        if (scene === "dialog") {
          await page
            .locator(
              '[data-slot="dialog-content"] > [data-slot="dialog-close"]:not([data-target])',
            )
            .evaluate((element) =>
              element.setAttribute("data-target", "dialog-icon-close"),
            );
          await page
            .locator('[data-slot="dialog-footer"] button')
            .evaluate((element) =>
              element.setAttribute("data-target", "dialog-footer-close"),
            );
        }
        const targets = await measure(page);
        expect(targets.map(({ name }) => name).sort()).toEqual(
          [...expectedTargets[scene]].sort(),
        );
        assertMinimum(targets);
        await page.close();
      });
    }
  }

  it("rejects an undersized target injected into the temporary built fixture", async () => {
    const page = await browser.newPage();
    await page.goto(`${origin}/?tiny=1`);
    await page.locator('[data-target="injected-tiny-control"]').waitFor();
    const tiny = (await measure(page)).filter(
      ({ name }) => name === "injected-tiny-control",
    );
    expect(tiny).toEqual([
      { name: "injected-tiny-control", width: 16, height: 16 },
    ]);
    expect(() => assertMinimum(tiny)).toThrow();
    await page.close();
  });
});
