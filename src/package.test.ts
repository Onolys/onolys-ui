// @vitest-environment node
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const exportsRequired = [
  ".",
  "./tokens",
  "./theme.css",
  "./tokens.css",
  "./base.css",
  "./fonts.css",
  "./legacy.css",
  "./components.json",
];
interface Manifest {
  name: string;
  type: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  exports: Record<string, string | { types: string; import: string }>;
}
interface Packed {
  filename: string;
  files: { path: string }[];
}
function run(command: string, args: string[], cwd: string): string {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: "pipe",
    timeout: 120_000,
  });
}
async function content(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
}
async function waitFor(
  check: () => boolean | Promise<boolean>,
  message: () => string,
  timeout = 15_000,
) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error(message());
}
async function stop(child: ChildProcess) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null)
    return;
  process.kill(-child.pid, "SIGTERM");
  await new Promise<void>((done) => child.once("exit", () => done()));
}

/** All builds, installs, and source edits happen in disposable fixtures. */
describe("packaged ESM and declaration contract", () => {
  let fixture: string;
  let library: string;
  let consumer: string;
  let manifest: Manifest;
  let packed: Packed;

  beforeAll(async () => {
    fixture = await mkdtemp(join(tmpdir(), "onolys-package-"));
    library = join(fixture, "library");
    consumer = join(fixture, "consumer");
    await mkdir(library);
    await mkdir(consumer);
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
    ]) {
      await cp(join(root, path), join(library, path), { recursive: true });
    }
    await symlink(
      join(root, "node_modules"),
      join(library, "node_modules"),
      "dir",
    );
    manifest = JSON.parse(
      await readFile(join(library, "package.json"), "utf8"),
    );
    expect(manifest.scripts).not.toHaveProperty("prepare");
    expect(
      run(
        process.execPath,
        [join(root, "node_modules/typescript/bin/tsc"), "--version"],
        library,
      ).trim(),
    ).toMatch(/^Version 6\.0\./);
    run("npm", ["run", "build"], library);
    [packed] = JSON.parse(
      run("npm", ["pack", "--json", "--pack-destination", fixture], library),
    ) as Packed[];
    await writeFile(
      join(consumer, "package.json"),
      JSON.stringify({
        name: "onolys-types-consumer",
        private: true,
        type: "module",
        dependencies: {
          "@onolys/ui": `file:${join(fixture, packed.filename)}`,
          react: manifest.devDependencies.react,
          "react-dom": manifest.devDependencies["react-dom"],
          tailwindcss: manifest.devDependencies.tailwindcss,
        },
        devDependencies: {
          "@types/react": manifest.devDependencies["@types/react"],
          "@types/react-dom": manifest.devDependencies["@types/react-dom"],
          typescript6: "npm:typescript@6.0.3",
          typescript7: "npm:typescript@7.0.2",
        },
      }),
    );
    run(
      "npm",
      ["install", "--no-audit", "--no-fund", "--package-lock=false"],
      consumer,
    );
    await writeFile(
      join(consumer, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "NodeNext",
          moduleResolution: "NodeNext",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: false,
          noEmit: true,
          types: ["react", "react-dom"],
        },
        include: ["consumer.tsx"],
      }),
    );
    await writeFile(
      join(consumer, "consumer.tsx"),
      `
      import { createRef, type ComponentProps } from 'react';
      import { AppHeader, Footer, SkipLink, Page, Section, Button, Input, Select, Checkbox, Tabs, TabsList, TabsTrigger, TabsContent, Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Tooltip, TooltipProvider, TooltipTrigger, TooltipContent, ScoreBadge, UsageMeter, Spinner, Progress, cn, buttonVariants, type AppHeaderProps, type FooterProps, type SkipLinkProps, type UsageMeterProps, type ScoreBadgeProps } from '@onolys/ui';
      import { tokens, contrastPairs, renderTokensCss, type Theme, type TokenName, type ColorTokenName, type TokenValues, type ContrastPair } from '@onolys/ui/tokens';
      const theme: Theme = 'dark'; const color: ColorTokenName = 'primary'; const name: TokenName = 'radius';
      const values: TokenValues = tokens[theme]; const pair: ContrastPair = contrastPairs[0];
      const css: string = renderTokensCss();
      const header: AppHeaderProps = { brand: <a href="#main">Example</a> };
      const footer: FooterProps = { copyright: 'Example' };
      const skip: SkipLinkProps = { targetId: 'main' };
      const usage: UsageMeterProps = { label: 'Usage', used: 1, cap: 2 };
      const score: ScoreBadgeProps = { variant: 'good', children: '3' };
      const select: ComponentProps<typeof Select> = { required: true, name: 'language', defaultValue: 'en', onChange: event => { const value: string = event.currentTarget.value; void value; } };
      export const app = <><SkipLink {...skip} /><AppHeader {...header} /><Page><Section><Button ref={createRef<HTMLButtonElement>()} size="icon" aria-label="Action" className={cn(buttonVariants({ variant: 'outline' }))}>+</Button><Input ref={createRef<HTMLInputElement>()} aria-label="Name" /><Select {...select} ref={createRef<HTMLSelectElement>()}><option value="en">English</option></Select><Checkbox aria-label="Accept" /><Tabs defaultValue="one"><TabsList><TabsTrigger value="one">One</TabsTrigger></TabsList><TabsContent value="one">Content</TabsContent></Tabs><ScoreBadge {...score} /><UsageMeter {...usage} /><Spinner /><Progress value={1} max={2} aria-label="Progress" /></Section></Page><Footer {...footer} /><Dialog><DialogTrigger>Open</DialogTrigger><DialogContent><DialogTitle>Title</DialogTitle><DialogDescription>Details</DialogDescription></DialogContent></Dialog><AlertDialog><AlertDialogContent><AlertDialogTitle>Confirm</AlertDialogTitle><AlertDialogDescription>Details</AlertDialogDescription><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction>Confirm</AlertDialogAction></AlertDialogContent></AlertDialog><DropdownMenu><DropdownMenuTrigger>Menu</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>Item</DropdownMenuItem></DropdownMenuContent></DropdownMenu><TooltipProvider><Tooltip><TooltipTrigger>Help</TooltipTrigger><TooltipContent>Details</TooltipContent></Tooltip></TooltipProvider></>;
      void [values[color], values[name], pair, css];
    `,
    );
  }, 120_000);

  afterAll(async () => {
    if (fixture) await rm(fixture, { recursive: true, force: true });
  });

  it("contains plain ESM, declarations, CSS, font and license files without prepare", async () => {
    const names = packed.files.map(({ path }) => path);
    expect(names).toEqual(
      expect.arrayContaining([
        "dist/index.js",
        "dist/index.d.ts",
        "dist/tokens/tokens.js",
        "dist/tokens/tokens.d.ts",
        "dist/theme.css",
        "dist/tokens.css",
        "dist/base.css",
        "dist/fonts.css",
        "dist/legacy.css",
        "fonts/inter-latin-wght-normal.woff2",
        "fonts/OFL.txt",
        "components.json",
        "LICENSE",
        "THIRD_PARTY_NOTICES.md",
      ]),
    );
    expect(
      names.some(
        (name) =>
          /\.cjs$/.test(name) ||
          /^(src|test|scripts|node_modules|stories)\//.test(name),
      ),
    ).toBe(false);
    expect(manifest.type).toBe("module");
    expect(manifest.scripts).not.toHaveProperty("prepare");
    expect(Object.keys(manifest.exports).sort()).toEqual(
      [...exportsRequired].sort(),
    );
    const installed = join(consumer, "node_modules/@onolys/ui");
    expect((await lstat(installed)).isSymbolicLink()).toBe(false);
    for (const asset of ["base", "tokens"])
      expect(await readFile(join(installed, `dist/${asset}.css`), "utf8")).toBe(
        await readFile(
          join(
            library,
            `src/${asset === "tokens" ? "tokens" : "styles"}/${asset}.css`,
          ),
          "utf8",
        ),
      );
    for (const asset of ["theme", "legacy"]) {
      const css = await readFile(join(installed, `dist/${asset}.css`), "utf8");
      expect(css).toContain('@import "./tokens.css";');
      for (const [, dependency] of css.matchAll(/@import ["'](\.[^"']+)["']/g))
        expect(
          await readFile(resolve(installed, "dist", dependency), "utf8"),
        ).not.toBe("");
    }
    const fontCss = await readFile(join(installed, "dist/fonts.css"), "utf8");
    const fontUrl = fontCss.match(/url\(['"]?([^)'"\s]+)['"]?\)/)?.[1];
    expect(fontUrl).toBe("../fonts/inter-latin-wght-normal.woff2");
    const font = await readFile(resolve(installed, "dist", fontUrl!));
    expect(font.subarray(0, 4).toString()).toBe("wOF2");
    expect(font).toEqual(
      await readFile(join(root, "fonts/inter-latin-wght-normal.woff2")),
    );
  });

  it("resolves every public export from the installed tarball and imports its ESM entries", async () => {
    await writeFile(
      join(consumer, "probe.mjs"),
      `
      import assert from 'node:assert/strict';
      import { readFile } from 'node:fs/promises';
      import { fileURLToPath } from 'node:url';
      const specs = ${JSON.stringify(exportsRequired)};
      const resolved = [];
      for (const subpath of specs) {
        const specifier = subpath === '.' ? '@onolys/ui' : '@onolys/ui/' + subpath.slice(2);
        const path = fileURLToPath(import.meta.resolve(specifier));
        assert.ok((await readFile(path)).length > 0); resolved.push(specifier);
      }
      const ui = await import('@onolys/ui'); const design = await import('@onolys/ui/tokens');
      assert.equal(typeof ui.Button, 'function'); assert.equal(typeof ui.Select, 'function');
      assert.equal(design.tokens.light.primary, '#0b5f5a');
      process.stdout.write(JSON.stringify(resolved));
    `,
    );
    const resolved = JSON.parse(run(process.execPath, ["probe.mjs"], consumer));
    expect(resolved).toHaveLength(exportsRequired.length);
  });

  for (const [alias, version] of [
    ["typescript6", "6.0.3"],
    ["typescript7", "7.0.2"],
  ]) {
    it(`typechecks the public React and token types under TypeScript ${version}`, () => {
      const compiler = join(consumer, `node_modules/${alias}/bin/tsc`);
      expect(
        run(process.execPath, [compiler, "--version"], consumer).trim(),
      ).toBe(`Version ${version}`);
      expect(
        run(
          process.execPath,
          [compiler, "--project", "tsconfig.json"],
          consumer,
        ),
      ).toBe("");
    }, 30_000);
  }

  it("build:watch refreshes TypeScript, plain CSS, and token CSS after edits", async () => {
    const watcher = spawn("npm", ["run", "build:watch"], {
      cwd: library,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    watcher.stdout!.on("data", (chunk) => {
      output += chunk.toString();
    });
    watcher.stderr!.on("data", (chunk) => {
      output += chunk.toString();
    });
    try {
      await waitFor(
        () =>
          output.includes("Watching for changes") &&
          /DTS.*Build success/.test(output),
        () => `Watcher did not initialize:\n${output}`,
      );
      const typescript = join(library, "src/index.ts");
      await writeFile(
        typescript,
        (await readFile(typescript, "utf8")) +
          '\nexport const watchDeclaration: "watch-ts-proof" = "watch-ts-proof";\n',
      );
      await waitFor(
        async () =>
          (await content(join(library, "dist/index.js"))).includes(
            "watch-ts-proof",
          ),
        () => `TypeScript edit was not rebuilt:\n${output}`,
      );
      await waitFor(
        async () =>
          (await content(join(library, "dist/index.d.ts"))).includes(
            "watchDeclaration",
          ),
        () => `TypeScript declarations were not rebuilt:\n${output}`,
      );
      await writeFile(
        join(library, "src/styles/base.css"),
        (await readFile(join(library, "src/styles/base.css"), "utf8")) +
          "\n/* watch-css-proof */\n",
      );
      await waitFor(
        async () =>
          (await content(join(library, "dist/base.css"))).includes(
            "watch-css-proof",
          ),
        () => `CSS edit was not copied:\n${output}`,
        5000,
      );
      await writeFile(
        join(library, "src/tokens/tokens.css"),
        (await readFile(join(library, "src/tokens/tokens.css"), "utf8")) +
          "\n/* watch-token-proof */\n",
      );
      await waitFor(
        async () =>
          (await content(join(library, "dist/tokens.css"))).includes(
            "watch-token-proof",
          ),
        () => `Token CSS edit was not copied:\n${output}`,
        5000,
      );
      expect(await content(join(library, "dist/index.d.ts"))).toContain(
        "Button",
      );
      expect(await content(join(library, "dist/tokens/tokens.d.ts"))).toContain(
        "TokenName",
      );
    } finally {
      await stop(watcher);
    }
  }, 60_000);
});
