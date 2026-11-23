import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve, extname, sep } from "node:path";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { assertStoryCoverage } from "./storybook-coverage.mjs";

const args = process.argv.slice(2);
const directory = resolve(args.includes("--dir") ? args[args.indexOf("--dir") + 1] : "storybook-static");
const negative = args.includes("--negative-fixture");
const index = JSON.parse(await readFile(resolve(directory, "index.json"), "utf8"));
const stories = negative
  ? Object.values(index.entries).filter((entry) => entry.type === "story")
  : assertStoryCoverage(index);
if (negative) assert.deepEqual(stories.map((entry) => entry.title), ["Validation/Negative"]);

const contentTypes = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const path = resolve(directory, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (!path.startsWith(directory + sep)) { response.writeHead(403).end(); return; }
  try {
    const body = await readFile(path);
    response.writeHead(200, { "Content-Type": contentTypes[extname(path)] ?? "application/octet-stream" });
    response.end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
let failures = 0;
let checks = 0;

async function exerciseKeyboard(page, id) {
  if (id === "ui-button--keyboard-focus") {
    await page.keyboard.press("Tab");
    assert.equal(await page.getByRole("button", { name: "Keyboard action" }).evaluate((node) => node === document.activeElement), true);
  }
  if (id === "ui-checkbox--default") {
    const checkbox = page.getByRole("checkbox", { name: "Use notifications" });
    await checkbox.focus(); await page.keyboard.press("Space");
    assert.equal(await checkbox.getAttribute("aria-checked"), "true");
  }
  if (id === "ui-tabs--horizontal") {
    await page.getByRole("tab", { name: "Summary", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => document.querySelector('[role="tab"][aria-selected="true"]')?.textContent === "Details");
    assert.equal(await page.getByRole("tab", { name: "Details", exact: true }).getAttribute("aria-selected"), "true");
  }
  if (id === "ui-select--keyboard") {
    const select = page.getByRole("combobox", { name: "View" });
    await select.focus(); await page.keyboard.press("End"); await page.keyboard.press("Enter");
    assert.equal(await select.inputValue(), "details");
  }
  if (id === "ui-tooltip--keyboard") {
    await page.getByRole("button", { name: "More information" }).focus();
    await page.getByRole("tooltip").waitFor({ state: "visible" });
  }
  if (id === "onolys-skiplink--keyboard") {
    await page.keyboard.press("Tab");
    assert.equal(await page.getByRole("link", { name: "Skip to main content" }).evaluate((node) => node === document.activeElement), true);
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("#main").evaluate((node) => node === document.activeElement), true);
    assert.equal(new URL(page.url()).hash, "#main");
  }
}

try {
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  for (const scheme of ["light", "dark"]) {
    const context = await browser.newContext({ colorScheme: scheme, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    for (const story of stories) {
      const errors = [];
      const onError = (error) => errors.push(error.message);
      page.on("pageerror", onError);
      try {
        await page.goto(`${origin}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`);
        await page.locator("[data-story-frame]").waitFor({ state: "visible" });
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate((scheme) => matchMedia(`(prefers-color-scheme: ${scheme})`).matches, scheme), true);
        if (story.title === "UI/Dialog" && story.name === "Open") await page.getByRole("dialog").waitFor();
        if (story.title === "UI/AlertDialog" && story.name !== "Closed") await page.getByRole("alertdialog").waitFor();
        if (story.title === "UI/DropdownMenu" && story.name !== "Closed") await page.getByRole("menu").first().waitFor();
        await exerciseKeyboard(page, story.id);
        // Match Storybook addon defaults: `region` is a page-level best practice,
        // not a WCAG rule; isolated component portals/skip links can sit outside landmarks.
        // Scan the whole document including portals, retaining every default WCAG rule.
        const results = await new AxeBuilder({ page }).disableRules(["region"]).analyze();
        assert.deepEqual(errors, [], "Story emitted an uncaught browser error");
        checks += 1;
        if (results.violations.length) {
          failures += 1;
          console.error(`FAIL ${scheme} ${story.id}: ${JSON.stringify(results.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ html, failureSummary }) => ({ html, failureSummary })) })))}`);
        } else console.log(`PASS ${scheme} ${story.id}`);
        if (story.title === "UI/Dialog" && story.name === "Open") {
          await page.keyboard.press("Escape");
          await page.getByRole("dialog").waitFor({ state: "hidden" });
          assert.equal(await page.getByRole("button", { name: "Open dialog" }).evaluate((node) => node === document.activeElement), true);
        }
        if (story.title === "UI/DropdownMenu" && story.name === "Open") {
          await page.getByRole("menuitem", { name: /^Edit/ }).focus();
          await page.keyboard.press("ArrowDown");
          // Radix schedules roving focus after the key event; await the exact destination.
          await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "menuitem"
            && document.activeElement.textContent === "Remove");
          assert.equal(await page.getByRole("menuitem", { name: "Remove", exact: true }).evaluate((node) => node === document.activeElement), true);
          await page.keyboard.press("Escape");
          await page.getByRole("menu").waitFor({ state: "hidden" });
        }
      } catch (error) {
        failures += 1;
        console.error(`FAIL ${scheme} ${story.id}: ${error.stack ?? error}`);
      } finally { page.off("pageerror", onError); }
    }
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
console.log(`Storybook axe: ${checks} scans across ${stories.length} stories in light/dark; ${failures} failures.`);
if (failures) process.exitCode = 1;
