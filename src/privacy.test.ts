// @vitest-environment node
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { privacyFindings, runtimeSourceFiles } from "../test/privacy-scan";

const source = fileURLToPath(new URL("./", import.meta.url));

function assertPrivate(root: string) {
  expect(privacyFindings(root)).toEqual([]);
}

it("ships source without browser storage, network, absolute URLs, raw HTML, console calls, or remote fonts", () => {
  expect(runtimeSourceFiles(source).length).toBeGreaterThan(20);
  assertPrivate(source);
});

describe("privacy guard negative controls", () => {
  it.each([
    ["local storage", "localStorage.setItem('key', 'value');", "storage"],
    ["session storage", "window.sessionStorage.clear();", "storage"],
    ["IndexedDB", "indexedDB.open('database');", "storage"],
    ["cookies", "document.cookie = 'key=value';", "storage"],
    ["cache", "caches.open('responses');", "storage"],
    [
      "service worker",
      "navigator.serviceWorker.register('/worker.js');",
      "storage",
    ],
    ["fetch", "fetch('/request');", "network"],
    ["bracket fetch", "window['fetch']('/request');", "network"],
    ["XHR", "new XMLHttpRequest();", "network"],
    ["socket", "new WebSocket('ws://example.invalid');", "network"],
    ["event stream", "new EventSource('/events');", "network"],
    ["beacon", "navigator.sendBeacon('/events', 'payload');", "network"],
    [
      "absolute URL",
      "export const endpoint = 'https://example.invalid';",
      "absolute-url",
    ],
    [
      "protocol relative URL",
      "export const endpoint = '//example.invalid/path';",
      "absolute-url",
    ],
    [
      "template URL",
      "export const endpoint = `https://${host}/path`;",
      "absolute-url",
    ],
    [
      "raw HTML",
      "export const node = <div dangerouslySetInnerHTML={{__html: value}} />;",
      "raw-html",
    ],
    ["console call", "console.log('message');", "console"],
    ["bracket console", "globalThis.console['warn']('message');", "console"],
    [
      "remote CSS",
      "export const css = '@import url(https://example.invalid/styles.css)';",
      "absolute-url",
    ],
  ])(
    "rejects %s injected into a temporary source tree",
    async (_name, code, rule) => {
      const fixture = await mkdtemp(join(tmpdir(), "onolys-privacy-"));
      try {
        await mkdir(join(fixture, "nested"));
        await writeFile(join(fixture, "nested/control.tsx"), code);
        expect(privacyFindings(fixture)).toContainEqual(
          expect.objectContaining({ file: "nested/control.tsx", rule }),
        );
        expect(() => assertPrivate(fixture)).toThrow();
      } finally {
        await rm(fixture, { recursive: true, force: true });
      }
    },
  );

  it("rejects a remote font injected into a temporary stylesheet", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "onolys-privacy-"));
    try {
      await writeFile(
        join(fixture, "fonts.css"),
        '@font-face { font-family: Remote; src: url("https://example.invalid/font.woff2") format("woff2"); }',
      );
      expect(privacyFindings(fixture)).toContainEqual(
        expect.objectContaining({ file: "fonts.css", rule: "remote-font" }),
      );
      expect(() => assertPrivate(fixture)).toThrow();
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  });

  it("allows relative assets and caller-owned links, ignores comments, and excludes test-only code", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "onolys-privacy-"));
    try {
      await writeFile(
        join(fixture, "link.tsx"),
        '// Never use localStorage or fetch("https://example.invalid") here.\nexport const Link = ({href, children}) => <a href={href}>{children}</a>;',
      );
      await writeFile(
        join(fixture, "fonts.css"),
        '/* Example documentation: https://example.invalid */\n@font-face { font-family: Inter; src: url("../../fonts/inter.woff2") format("woff2"); }',
      );
      await writeFile(
        join(fixture, "fixture.test.ts"),
        'fetch("https://example.invalid"); console.log("test only");',
      );
      expect(privacyFindings(fixture)).toEqual([]);
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  });

  it("skips only the emulator test helper auth/testing.ts, not other files in auth/", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "onolys-privacy-"));
    try {
      await mkdir(join(fixture, "auth"));
      await writeFile(join(fixture, "auth/testing.ts"), 'fetch("http://127.0.0.1:9099");');
      expect(privacyFindings(fixture)).toEqual([]);
      await writeFile(join(fixture, "auth/other.ts"), 'fetch("http://127.0.0.1:9099");');
      expect(privacyFindings(fixture)).toContainEqual(expect.objectContaining({ file: "auth/other.ts", rule: "network" }));
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  });

  it("allows localStorage only in the named theme storage file", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "onolys-privacy-"));
    try {
      await mkdir(join(fixture, "lib"));
      await writeFile(
        join(fixture, "lib/theme.ts"),
        'export const read = () => localStorage.getItem("onolys-theme");',
      );
      await writeFile(
        join(fixture, "lib/other.ts"),
        'export const read = () => localStorage.getItem("onolys-theme");',
      );
      expect(privacyFindings(fixture)).toEqual([
        expect.objectContaining({ file: "lib/other.ts", rule: "storage" }),
      ]);
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  });

  it("keeps every other rule active inside the theme storage file", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "onolys-privacy-"));
    try {
      await mkdir(join(fixture, "lib"));
      await writeFile(
        join(fixture, "lib/theme.ts"),
        "sessionStorage.clear(); fetch('/x'); console.log('x');",
      );
      expect(privacyFindings(fixture).map((f) => f.rule).sort()).toEqual([
        "console",
        "network",
        "storage",
      ]);
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  });
});
