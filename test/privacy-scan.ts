import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import ts from "typescript";

export interface PrivacyFinding {
  file: string;
  line: number;
  rule:
    | "storage"
    | "network"
    | "absolute-url"
    | "raw-html"
    | "console"
    | "remote-font";
  match: string;
}

/**
 * `auth/testing.ts` is the emulator test helper (`@onolys/common/auth/testing`): it talks to the Auth emulator
 * over HTTP and names its URL. It is never imported by the app runtime, so it is scanned like test code.
 */
const testHelper = /(?:^|[\\/])auth[\\/]testing\.ts$/;

/** Test fixtures and declarations do not execute in the shipped component library. */
export function runtimeSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return runtimeSourceFiles(path);
      return /\.(?:[cm]?[jt]sx?|css)$/.test(entry.name) &&
        !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name) &&
        !/\.d\.[cm]?ts$/.test(entry.name) &&
        !testHelper.test(path)
        ? [path]
        : [];
    });
}

const storage = new Set([
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "caches",
  "serviceWorker",
  "setPersistence",
  "persistentLocalCache",
]);
/**
 * The one named exception: the theme preference file may use localStorage
 * (key `onolys-theme`). Paths are relative to the scanned source root (`src`).
 * Every other storage API, and every other rule, still applies to it.
 */
const storageExceptions: Record<string, ReadonlySet<string>> = {
  "lib/theme.ts": new Set(["localStorage"]),
};
const network = new Set([
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "sendBeacon",
  "Worker",
  "SharedWorker",
]);
const absoluteUrl = /\b[a-z][a-z\d+.-]*:\/\/|(?:^|[\s("'`])\/\//i;

function memberName(node: ts.Node): string | undefined {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) return node.text;
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (ts.isElementAccessExpression(node) && node.argumentExpression)
    return memberName(node.argumentExpression);
}

/** Static source guard, not a data-flow audit of callers or third-party dependencies. */
export function privacyFindings(root: string): PrivacyFinding[] {
  return runtimeSourceFiles(root).flatMap((file) => {
    const code = readFileSync(file, "utf8");
    const findings: PrivacyFinding[] = [];
    function report(
      rule: PrivacyFinding["rule"],
      match: string,
      position: number,
    ) {
      findings.push({
        file: relative(root, file),
        line: code.slice(0, position).split("\n").length,
        rule,
        match,
      });
    }
    if (file.endsWith(".css")) {
      const css = code.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
        comment.replace(/[^\n]/g, " "),
      );
      for (const match of css.matchAll(
        /(?:\b[a-z][a-z\d+.-]*:\/\/|\/\/)[^\s)"';]+/gi,
      ))
        report("absolute-url", match[0], match.index);
      for (const block of css.matchAll(/@font-face\s*\{[^}]*\}/gi)) {
        for (const match of block[0].matchAll(/url\(\s*["']?([^\s)'";]+)/gi)) {
          if (absoluteUrl.test(match[1]) || /^data:/i.test(match[1]))
            report("remote-font", match[1], block.index + match.index);
        }
      }
      return findings;
    }
    // Parsing avoids treating documentation comments as capabilities and resolves escaped strings.
    const source = ts.createSourceFile(
      file,
      code,
      ts.ScriptTarget.Latest,
      true,
      /x$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    function visit(node: ts.Node) {
      const position = node.getStart(source);
      if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) {
        if (
          storage.has(node.text) &&
          !storageExceptions[relative(root, file).split(sep).join("/")]?.has(
            node.text,
          )
        )
          report("storage", node.text, position);
        if (network.has(node.text)) report("network", node.text, position);
        if (node.text === "dangerouslySetInnerHTML")
          report("raw-html", node.text, position);
        if (node.text === "console") report("console", node.text, position);
      }
      if (
        (ts.isStringLiteralLike(node) ||
          ts.isTemplateHead(node) ||
          ts.isTemplateMiddle(node) ||
          ts.isTemplateTail(node)) &&
        absoluteUrl.test(node.text)
      ) {
        report("absolute-url", node.text, position);
      }
      if (
        (ts.isPropertyAccessExpression(node) ||
          ts.isElementAccessExpression(node)) &&
        memberName(node) === "cookie" &&
        memberName(node.expression) === "document"
      )
        report("storage", node.getText(source), position);
      ts.forEachChild(node, visit);
    }
    visit(source);
    return findings;
  });
}
