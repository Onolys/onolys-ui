import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const { values } = parseArgs({ options: { spec: { type: "string" } } });
const spec = values.spec ?? "";
const stable = "v(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)";
if (
  !new RegExp(
    `^(?:github:Onolys/onolys-ui|git\\+https://github\\.com/Onolys/onolys-ui\\.git)#${stable}$`,
  ).test(spec) &&
  !new RegExp(`^git\\+file:///.+#${stable}$`).test(spec)
)
  throw new Error(
    "Expected the public GitHub release spec or a local git+file release fixture",
  );
const expectedVersion = spec.split("#v")[1];
// This also runs after the detached release manifest has removed devDependencies.
const toolchain = {
  react: "19.3.1",
  "react-dom": "19.3.1",
  vite: "8.3.8",
  tailwindcss: "4.3.5",
  "@tailwindcss/vite": "4.3.5",
};
const fixture = await mkdtemp(join(tmpdir(), "onolys-git-consumer-"));
let browser;
let server;
try {
  const env = { ...process.env };
  for (const key of Object.keys(env))
    if (
      /^npm_config_/i.test(key) ||
      [
        "GH_TOKEN",
        "GITHUB_TOKEN",
        "NODE_AUTH_TOKEN",
        "NPM_TOKEN",
        "GIT_ASKPASS",
        "SSH_ASKPASS",
        "GIT_SSH",
        "GIT_SSH_COMMAND",
      ].includes(key)
    )
      delete env[key];
  Object.assign(env, {
    npm_config_cache: join(fixture, "npm-cache"),
    npm_config_userconfig: join(fixture, ".npmrc"),
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_TERMINAL_PROMPT: "0",
    GIT_CONFIG_COUNT: "2",
    GIT_CONFIG_KEY_0: "url.https://github.com/.insteadOf",
    GIT_CONFIG_VALUE_0: "ssh://git@github.com/",
    GIT_CONFIG_KEY_1: "url.https://github.com/.insteadOf",
    GIT_CONFIG_VALUE_1: "git@github.com:",
  });
  const run = (command, args) =>
    execFileSync(command, args, {
      cwd: fixture,
      env,
      encoding: "utf8",
      stdio: "pipe",
      timeout: 180_000,
    });
  await writeFile(
    join(fixture, ".npmrc"),
    "registry=https://registry.npmjs.org/\n",
  );
  await writeFile(
    join(fixture, "package.json"),
    JSON.stringify({
      name: "release-consumer",
      private: true,
      type: "module",
      dependencies: {
        "@onolys/ui": spec,
        react: toolchain.react,
        "react-dom": toolchain["react-dom"],
      },
      devDependencies: {
        vite: toolchain.vite,
        tailwindcss: toolchain.tailwindcss,
        "@tailwindcss/vite": toolchain["@tailwindcss/vite"],
      },
    }),
  );
  run("npm", ["install", "--no-audit", "--no-fund", "--package-lock=false"]);
  await writeFile(
    join(fixture, "probe.mjs"),
    `
    import assert from 'node:assert/strict'; import { readFile, access } from 'node:fs/promises'; import { dirname, resolve } from 'node:path'; import { fileURLToPath } from 'node:url';
    const root = resolve(dirname(fileURLToPath(import.meta.resolve('@onolys/ui'))), '..');
    const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
    assert.equal(manifest.version, ${JSON.stringify(expectedVersion)}); assert.equal(manifest.scripts, undefined); assert.equal(manifest.devDependencies, undefined);
    for (const [key, value] of Object.entries(manifest.exports)) {
      const target = fileURLToPath(import.meta.resolve(key === '.' ? '@onolys/ui' : '@onolys/ui/' + key.slice(2)));
      assert.ok((await readFile(target)).length);
      if (typeof value === 'object') assert.ok((await readFile(resolve(root, value.types))).length);
    }
    for (const tool of ['tsup', '@storybook']) await assert.rejects(access(resolve('node_modules', tool)));
    const ui = await import('@onolys/ui'); const tokens = await import('@onolys/ui/tokens'); assert.equal(typeof ui.Button, 'function'); assert.equal(tokens.tokens.light.primary, '#0b5f5a');
    const css = await readFile(resolve(root, 'dist/fonts.css'), 'utf8'); const font = css.match(/url\\(['"]?([^)'"]+)/)[1];
    assert.equal((await readFile(resolve(root, 'dist', font))).subarray(0,4).toString(), 'wOF2');
    process.stdout.write(JSON.stringify({ version: manifest.version, exports: Object.keys(manifest.exports).length, noBuildScripts: true }));
  `,
  );
  const result = JSON.parse(run(process.execPath, ["probe.mjs"]));
  await writeFile(
    join(fixture, "index.html"),
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Git release consumer</title></head><body><div id="root"></div><script type="module" src="./main.jsx"></script></body></html>',
  );
  await writeFile(
    join(fixture, "main.jsx"),
    `import React from 'react'; import { createRoot } from 'react-dom/client'; import { Button, Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@onolys/ui'; import './style.css'; createRoot(document.getElementById('root')).render(<><Button id="brand">Brand</Button><Dialog><DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger><DialogContent><DialogTitle>Release dialog</DialogTitle><DialogDescription>Git-installed component.</DialogDescription><Button>Continue</Button></DialogContent></Dialog></>);`,
  );
  await writeFile(
    join(fixture, "style.css"),
    '@import "tailwindcss";\n@import "@onolys/ui/theme.css";\n@source "./node_modules/@onolys/ui/dist";\n',
  );
  await writeFile(
    join(fixture, "vite.config.mjs"),
    "import tailwindcss from '@tailwindcss/vite'; export default { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } };",
  );
  run(process.execPath, [
    join(fixture, "node_modules/vite/bin/vite.js"),
    "build",
  ]);
  server = createServer(async (request, response) => {
    const path = resolve(
      fixture,
      "dist",
      `.${new URL(request.url ?? "/", "http://localhost").pathname === "/" ? "/index.html" : new URL(request.url, "http://localhost").pathname}`,
    );
    if (!path.startsWith(resolve(fixture, "dist") + sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(path);
      const types = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".woff2": "font/woff2",
      };
      response.writeHead(200, {
        "Content-Type": types[extname(path)] ?? "application/octet-stream",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  await page.addInitScript(() => {
    const violations = [];
    Object.assign(window, { releaseCspViolations: violations });
    document.addEventListener("securitypolicyviolation", (event) =>
      violations.push(event.effectiveDirective),
    );
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(
    await page
      .locator("#brand")
      .evaluate((element) => getComputedStyle(element).backgroundColor),
    "rgb(11, 95, 90)",
  );
  await page.getByRole("button", { name: "Open dialog" }).click();
  await page.getByRole("dialog", { name: "Release dialog" }).waitFor();
  assert.equal(
    await page
      .locator("body")
      .evaluate((element) => getComputedStyle(element).overflow),
    "hidden",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "detached" });
  assert.deepEqual(await page.evaluate(() => window.releaseCspViolations), []);
  console.log(
    JSON.stringify({
      ...result,
      button: "teal",
      dialog: true,
      cspViolations: 0,
    }),
  );
} finally {
  await browser?.close();
  if (server) await new Promise((done) => server.close(() => done()));
  await rm(fixture, { recursive: true, force: true });
}
