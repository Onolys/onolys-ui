// @vitest-environment node
import { execFileSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const versions = {
  vite: "8.3.8",
  tailwindcss: "4.3.5",
  "@tailwindcss/vite": "4.3.5",
  astro: "7.4.13",
  react: "19.3.1",
  "react-dom": "19.3.1",
};
const policy =
  "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'";
const teal = "rgb(11, 95, 90)";
const darkTeal = "rgb(95, 196, 184)";
function run(command: string, args: string[], cwd: string): string {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: "pipe",
    timeout: 180_000,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
  });
}
async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) =>
        entry.isDirectory()
          ? files(join(directory, entry.name))
          : [join(directory, entry.name)],
      ),
    )
  ).flat();
}
async function serve(directory: string) {
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    const path = resolve(
      directory,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    if (!path.startsWith(directory + sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(path);
      const mime: Record<string, string> = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".woff2": "font/woff2",
      };
      response.writeHead(200, {
        "Content-Type": mime[extname(path)] ?? "application/octet-stream",
        "Content-Security-Policy": policy,
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing consumer fixture port");
  return { server, origin: `http://127.0.0.1:${address.port}` };
}
async function observe(page: Page) {
  const fonts: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "font") fonts.push(request.url());
  });
  await page.addInitScript(() => {
    const captured: string[] = [];
    Object.assign(window, { cspViolations: captured });
    document.addEventListener("securitypolicyviolation", (event) =>
      captured.push(`${event.effectiveDirective}: ${event.blockedURI}`),
    );
  });
  return fonts;
}
const violations = (page: Page) =>
  page.evaluate(() => Reflect.get(window, "cspViolations") as string[]);
function assertNoCsp(found: string[]) {
  expect(found).toEqual([]);
}
async function assertLocalFont(page: Page, origin: string, requests: string[]) {
  await page.evaluate(() => document.fonts.ready);
  expect(requests.length).toBeGreaterThan(0);
  expect(
    requests.every(
      (url) => url.startsWith(`${origin}/`) && /\.woff2(?:$|\?)/.test(url),
    ),
  ).toBe(true);
  expect(
    await page
      .locator("body")
      .evaluate((body) => getComputedStyle(body).fontFamily),
  ).toContain("Inter Variable");
  expect(
    await page.evaluate(() =>
      [...document.fonts].some(
        (font) =>
          font.family.includes("Inter Variable") && font.status === "loaded",
      ),
    ),
  ).toBe(true);
}

describe("independent packed-tarball consumers", () => {
  let fixture: string;
  let vite: string;
  let astro: string;
  let viteOutput: string;
  let astroOutput: string;
  let missingSourceOutput: string;
  let browser: Browser;
  const servers: Server[] = [];
  let viteOrigin: string;
  let astroOrigin: string;
  let missingSourceOrigin: string;

  beforeAll(async () => {
    fixture = await mkdtemp(join(tmpdir(), "onolys-consumers-"));
    const library = join(fixture, "library");
    vite = join(fixture, "vite");
    astro = join(fixture, "astro");
    await Promise.all([
      mkdir(library),
      mkdir(join(vite, "src"), { recursive: true }),
      mkdir(join(astro, "src/pages"), { recursive: true }),
    ]);
    for (const path of [
      "package.json",
      "tsconfig.json",
      "tsup.config.ts",
      "src",
      "test",
      "scripts",
      "fonts",
      "components.json",
      "README.md",
      "LICENSE",
      "THIRD_PARTY_NOTICES.md",
    ])
      await cp(join(root, path), join(library, path), { recursive: true });
    await symlink(
      join(root, "node_modules"),
      join(library, "node_modules"),
      "dir",
    );
    run("npm", ["run", "build"], library);
    const [packed] = JSON.parse(
      run("npm", ["pack", "--json", "--pack-destination", fixture], library),
    ) as { filename: string }[];
    const dependency = `file:${join(fixture, packed.filename)}`;
    await writeFile(
      join(vite, "package.json"),
      JSON.stringify({
        name: "vite-consumer",
        private: true,
        type: "module",
        dependencies: {
          "@onolys/ui": dependency,
          react: versions.react,
          "react-dom": versions["react-dom"],
        },
        devDependencies: {
          vite: versions.vite,
          tailwindcss: versions.tailwindcss,
          "@tailwindcss/vite": versions["@tailwindcss/vite"],
        },
      }),
    );
    await writeFile(
      join(astro, "package.json"),
      JSON.stringify({
        name: "astro-css-consumer",
        private: true,
        type: "module",
        dependencies: { "@onolys/ui": dependency },
        devDependencies: {
          astro: versions.astro,
          vite: versions.vite,
          tailwindcss: versions.tailwindcss,
          "@tailwindcss/vite": versions["@tailwindcss/vite"],
        },
      }),
    );
    run(
      "npm",
      ["install", "--no-audit", "--no-fund", "--package-lock=false"],
      vite,
    );
    run(
      "npm",
      [
        "install",
        "--omit=peer",
        "--no-audit",
        "--no-fund",
        "--package-lock=false",
      ],
      astro,
    );
    viteOutput = join(fixture, "vite-built");
    astroOutput = join(astro, "dist");
    missingSourceOutput = join(fixture, "vite-missing-source");
    await writeFile(
      join(vite, "vite.config.mjs"),
      `import { defineConfig } from 'vite'; import tailwindcss from '@tailwindcss/vite'; export default defineConfig({ plugins: [tailwindcss()], build: { assetsInlineLimit: 0, emptyOutDir: true } });`,
    );
    await writeFile(
      join(vite, "index.html"),
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Packed React consumer</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>',
    );
    await writeFile(
      join(vite, "src/main.jsx"),
      `
      import React from 'react'; import { createRoot } from 'react-dom/client';
      import { Page, Button, Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Select } from '@onolys/ui';
      import './style.css';
      function App() {
        const [result, setResult] = React.useState('Ready'); const [language, setLanguage] = React.useState('en');
        return <Page><h1>Packed consumer</h1><Button id="brand">Brand button</Button>
          <Dialog><DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger><DialogContent><DialogTitle>Preferences</DialogTitle><DialogDescription>Update preferences.</DialogDescription><Button>First</Button><Button>Last</Button></DialogContent></Dialog>
          <AlertDialog><AlertDialogTrigger asChild><Button>Open confirmation</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogTitle>Confirm action</AlertDialogTitle><AlertDialogDescription>Continue with this action?</AlertDialogDescription><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => setResult('Confirmed')}>Confirm</AlertDialogAction></AlertDialogContent></AlertDialog>
          <DropdownMenu><DropdownMenuTrigger asChild><Button>Open account</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => setResult('Profile selected')}>Profile</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          <Select aria-label="Language" value={language} onChange={event => setLanguage(event.currentTarget.value)}><option value="en">English</option><option value="fr">French</option></Select>
          <p role="status">{result}</p><output aria-label="Selected language">{language}</output>
          {new URLSearchParams(location.search).has('inline') && <style>{'body { border: 1px solid red; }'}</style>}
        </Page>;
      }
      createRoot(document.getElementById('root')).render(<App />);
    `,
    );
    const css = '@import "tailwindcss";\n@import "@onolys/ui/theme.css";\n';
    const scannedCss = css + '@source "../node_modules/@onolys/ui/dist";\n';
    await writeFile(join(vite, "src/style.css"), scannedCss);
    run(
      process.execPath,
      [
        join(vite, "node_modules/vite/bin/vite.js"),
        "build",
        "--outDir",
        viteOutput,
      ],
      vite,
    );
    await writeFile(join(vite, "src/style.css"), css);
    run(
      process.execPath,
      [
        join(vite, "node_modules/vite/bin/vite.js"),
        "build",
        "--outDir",
        missingSourceOutput,
      ],
      vite,
    );
    await writeFile(join(vite, "src/style.css"), scannedCss);
    await writeFile(
      join(astro, "astro.config.mjs"),
      `import { defineConfig } from 'astro/config'; import tailwindcss from '@tailwindcss/vite'; export default defineConfig({ build: { inlineStylesheets: 'never' }, vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } } });`,
    );
    await writeFile(
      join(astro, "src/theme.css"),
      '@import "tailwindcss";\n@import "@onolys/ui/theme.css";\n',
    );
    await writeFile(
      join(astro, "src/pages/index.astro"),
      '---\nimport "../theme.css";\n---\n<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>CSS-only consumer</title></head><body><main><h1>Theme only</h1><p>Self-hosted font and semantic tokens.</p></main></body></html>',
    );
    run(
      process.execPath,
      [join(astro, "node_modules/astro/bin/astro.mjs"), "build"],
      astro,
    );
    for (const [kind, directory] of [
      ["vite", viteOutput],
      ["astro", astroOutput],
      ["missing", missingSourceOutput],
    ]) {
      const served = await serve(directory);
      servers.push(served.server);
      if (kind === "vite") viteOrigin = served.origin;
      else if (kind === "astro") astroOrigin = served.origin;
      else missingSourceOrigin = served.origin;
    }
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  }, 180_000);

  afterAll(async () => {
    await browser?.close();
    await Promise.all(
      servers.map(
        (server) => new Promise<void>((done) => server.close(() => done())),
      ),
    );
    if (fixture) await rm(fixture, { recursive: true, force: true });
  });

  it("installs genuine independent packages with exact consumer toolchains", async () => {
    for (const directory of [vite, astro])
      expect(
        (
          await lstat(join(directory, "node_modules/@onolys/ui"))
        ).isSymbolicLink(),
      ).toBe(false);
    for (const [directory, names] of [
      [
        vite,
        ["vite", "tailwindcss", "@tailwindcss/vite", "react", "react-dom"],
      ],
      [astro, ["astro", "vite", "tailwindcss", "@tailwindcss/vite"]],
    ] as const) {
      for (const name of names)
        expect(
          JSON.parse(
            await readFile(
              join(directory, "node_modules", name, "package.json"),
              "utf8",
            ),
          ).version,
        ).toBe(versions[name]);
    }
    expect(await readFile(join(vite, "src/main.jsx"), "utf8")).not.toMatch(
      /className\s*=/,
    );
    await expect(lstat(join(astro, "node_modules/react"))).rejects.toThrow();
    await expect(
      lstat(join(astro, "node_modules/react-dom")),
    ).rejects.toThrow();
  });

  it("renders the teal Button from scanned package classes, loads a local font, and switches dark tokens", async () => {
    const page = await browser.newPage({ colorScheme: "light" });
    const fonts = await observe(page);
    const response = await page.goto(viteOrigin);
    expect(response?.headers()["content-security-policy"]).toBe(policy);
    expect(
      await page
        .locator("#brand")
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    ).toBe(teal);
    await assertLocalFont(page, viteOrigin, fonts);
    const lightBackground = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim(),
    );
    expect(lightBackground).not.toBe("");
    expect(
      await page
        .locator("body")
        .evaluate((body) => getComputedStyle(body).backgroundColor),
    ).toBe("rgb(255, 255, 255)");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect
      .poll(() =>
        page
          .locator("#brand")
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .toBe(darkTeal);
    const darkBackground = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim(),
    );
    expect(darkBackground).not.toBe("");
    expect(darkBackground).not.toBe(lightBackground);
    expect(
      await page
        .locator("body")
        .evaluate((body) => getComputedStyle(body).backgroundColor),
    ).toBe("rgb(15, 21, 20)");
    assertNoCsp(await violations(page));
    await page.close();
  });

  for (const colorScheme of ["light", "dark"] as const) {
    it(`${colorScheme}: opens packaged overlays and selects a native option with zero CSP violations`, async () => {
      const page = await browser.newPage({
        colorScheme,
        reducedMotion: "reduce",
      });
      await observe(page);
      await page.goto(viteOrigin);
      await page.getByRole("button", { name: "Open dialog" }).click();
      await expect
        .poll(() => page.getByRole("dialog", { name: "Preferences" }).count())
        .toBe(1);
      expect(
        await page
          .locator("body")
          .evaluate((body) => getComputedStyle(body).overflow),
      ).toBe("hidden");
      await page.keyboard.press("Escape");
      await expect.poll(() => page.getByRole("dialog").count()).toBe(0);
      await page.getByRole("button", { name: "Open confirmation" }).click();
      await expect
        .poll(() =>
          page.getByRole("alertdialog", { name: "Confirm action" }).count(),
        )
        .toBe(1);
      expect(
        await page
          .getByRole("button", { name: "Cancel", exact: true })
          .evaluate((element) => element === document.activeElement),
      ).toBe(true);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await expect
        .poll(() =>
          page
            .getByRole("status", { name: "", exact: true })
            .first()
            .textContent(),
        )
        .toBe("Confirmed");
      await page.getByRole("button", { name: "Open account" }).click();
      await expect.poll(() => page.getByRole("menu").count()).toBe(1);
      await page.getByRole("menuitem", { name: "Profile" }).click();
      await expect
        .poll(() => page.getByText("Profile selected", { exact: true }).count())
        .toBe(1);
      await page.getByRole("combobox", { name: "Language" }).click();
      await page.keyboard.press("End");
      await page.keyboard.press("Enter");
      expect(
        await page.getByRole("combobox", { name: "Language" }).inputValue(),
      ).toBe("fr");
      expect(await page.getByLabel("Selected language").textContent()).toBe(
        "fr",
      );
      assertNoCsp(await violations(page));
      expect(await page.locator("style").count()).toBe(0);
      await page.close();
    });
  }

  it("detects missing @source without the app spelling package utility classes", async () => {
    const page = await browser.newPage({ colorScheme: "light" });
    await page.goto(missingSourceOrigin);
    const background = await page
      .locator("#brand")
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(background).not.toBe(teal);
    expect(() => expect(background).toBe(teal)).toThrow();
    await page.close();
  });

  it("rejects a deliberately injected inline stylesheet under the real CSP header", async () => {
    const page = await browser.newPage();
    await observe(page);
    await page.goto(`${viteOrigin}/?inline=1`);
    await expect
      .poll(() => violations(page))
      .toContain("style-src-elem: inline");
    const captured = await violations(page);
    expect(() => assertNoCsp(captured)).toThrow();
    await page.close();
  });

  it("emits file fonts and no data URLs in either consumer's production CSS", async () => {
    for (const directory of [viteOutput, astroOutput]) {
      const output = await files(directory);
      const cssFiles = output.filter((file) => file.endsWith(".css"));
      const fontFiles = output.filter((file) => file.endsWith(".woff2"));
      expect(cssFiles.length).toBeGreaterThan(0);
      expect(fontFiles.length).toBeGreaterThan(0);
      const css = (
        await Promise.all(cssFiles.map((file) => readFile(file, "utf8")))
      ).join("\n");
      expect(css).toContain("@font-face");
      expect(css).not.toMatch(/url\(\s*["']?data:/i);
      for (const font of fontFiles)
        expect((await readFile(font)).subarray(0, 4).toString()).toBe("wOF2");
    }
  });

  it("builds and serves Astro with theme CSS, semantic tokens, local fonts and no React/client runtime", async () => {
    const output = await files(astroOutput);
    expect(output.some((file) => /\.[cm]?js$/.test(file))).toBe(false);
    const html = await readFile(join(astroOutput, "index.html"), "utf8");
    expect(html).not.toContain("<script");
    expect(html).toContain('rel="stylesheet"');
    expect(await readFile(join(astro, "src/theme.css"), "utf8")).toBe(
      '@import "tailwindcss";\n@import "@onolys/ui/theme.css";\n',
    );
    const page = await browser.newPage({ colorScheme: "light" });
    const fonts = await observe(page);
    await page.goto(astroOrigin);
    await assertLocalFont(page, astroOrigin, fonts);
    expect(await page.locator("h1").textContent()).toBe("Theme only");
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--primary")
          .trim(),
      ),
    ).toBe("#0b5f5a");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect
      .poll(() =>
        page
          .locator("body")
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .toBe("rgb(15, 21, 20)");
    expect(await page.locator("script").count()).toBe(0);
    assertNoCsp(await violations(page));
    await page.close();
  });
});
