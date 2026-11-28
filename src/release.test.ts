// @vitest-environment node
import { execFileSync } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
function run(
  command: string,
  args: string[],
  cwd: string,
  extraEnv: NodeJS.ProcessEnv = {},
) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: "pipe",
    timeout: 180_000,
    env: { ...process.env, ...extraEnv },
  });
}
function attempt(
  command: string,
  args: string[],
  cwd: string,
  extraEnv: NodeJS.ProcessEnv = {},
) {
  try {
    return { ok: true, output: run(command, args, cwd, extraEnv) };
  } catch (error) {
    const failed = error as Error & { stderr?: Buffer };
    return { ok: false, output: `${failed.message}\n${failed.stderr ?? ""}` };
  }
}

describe("immutable detached release tooling", () => {
  let fixture: string;
  let source: string;
  let sourceSha: string;
  const trigger = "release/v0.1.0";
  const notes =
    "# Changelog\n\n## [Unreleased]\n\n## [0.1.0] - 2026-11-23\n\n### Added\n- Shared design tokens and accessible components.\n";
  let releaseCli: string;

  beforeAll(async () => {
    fixture = await mkdtemp(join(tmpdir(), "onolys-release-test-"));
    source = join(fixture, "source");
    await mkdir(source);
    for (const path of [
      "package.json",
      "package-lock.json",
      "tsconfig.json",
      "tsup.config.ts",
      ".gitignore",
      ".github",
      "src",
      "test",
      "scripts",
      "fonts",
      "components.json",
      "README.md",
      "LICENSE",
      "THIRD_PARTY_NOTICES.md",
    ])
      await cp(join(root, path), join(source, path), { recursive: true });
    for (const name of ["package.json", "package-lock.json"]) {
      const path = join(source, name);
      const manifest = JSON.parse(await readFile(path, "utf8"));
      manifest.version = "0.1.0";
      if (manifest.packages) manifest.packages[""].version = "0.1.0";
      await writeFile(path, JSON.stringify(manifest, null, 2) + "\n");
    }
    await writeFile(join(source, "CHANGELOG.md"), notes);
    run("git", ["init", "--initial-branch=main"], source);
    run("git", ["config", "user.name", "Release fixture"], source);
    run(
      "git",
      ["config", "user.email", "release-fixture@example.invalid"],
      source,
    );
    run("git", ["add", "."], source);
    run("git", ["commit", "-m", "Reviewed source fixture"], source);
    sourceSha = run("git", ["rev-parse", "HEAD"], source).trim();
    run("git", ["tag", trigger, sourceSha], source);
    releaseCli = join(source, "scripts/release.mjs");
  });
  afterAll(async () => {
    if (fixture) await rm(fixture, { recursive: true, force: true });
  });

  it("validates the exact trigger source, aligned versions and changelog notes", () => {
    const result = JSON.parse(
      run(
        process.execPath,
        [releaseCli, "validate", "--trigger", trigger, "--source", sourceSha],
        source,
      ),
    );
    expect(result).toMatchObject({
      version: "0.1.0",
      tag: "v0.1.0",
      source: sourceSha,
    });
  });

  it.each([
    "v0.1.0",
    "release/v01.1.0",
    "release/v0.1.0/../../main",
    "release/v0.1.0;echo bad",
    "release/v0.1.0-rc.1",
  ])("rejects malformed trigger %s", (bad) => {
    const result = attempt(
      process.execPath,
      [releaseCli, "validate", "--trigger", bad, "--source", sourceSha],
      source,
    );
    expect(result.ok).toBe(false);
    expect(result.output).toContain("Invalid release trigger");
  });

  it("rejects a mismatched source and refuses building on a branch", () => {
    const mismatch = attempt(
      process.execPath,
      [
        releaseCli,
        "validate",
        "--trigger",
        trigger,
        "--source",
        "0".repeat(40),
      ],
      source,
    );
    expect(mismatch.ok).toBe(false);
    expect(mismatch.output).toContain("source commit");
    const branch = attempt(
      process.execPath,
      [
        releaseCli,
        "build",
        "--trigger",
        trigger,
        "--source",
        sourceSha,
        "--output",
        join(fixture, "must-not-build"),
      ],
      source,
    );
    expect(branch.ok).toBe(false);
    expect(branch.output).toContain("detached HEAD");
    expect(run("git", ["branch", "--show-current"], source).trim()).toBe(
      "main",
    );
    expect(run("git", ["ls-files", "dist"], source)).toBe("");
  });

  it("rejects missing changelog notes and version/lock mismatches without changes", async () => {
    const path = join(source, "CHANGELOG.md");
    await writeFile(path, "# Changelog\n\n## [Unreleased]\n");
    try {
      const result = attempt(
        process.execPath,
        [releaseCli, "validate", "--trigger", trigger, "--source", sourceSha],
        source,
      );
      expect(result.ok).toBe(false);
      expect(result.output).toContain("CHANGELOG");
    } finally {
      await writeFile(path, notes);
    }
    const lockPath = join(source, "package-lock.json");
    const original = await readFile(lockPath, "utf8");
    const lock = JSON.parse(original);
    lock.packages[""].version = "9.9.9";
    await writeFile(lockPath, JSON.stringify(lock));
    try {
      const result = attempt(
        process.execPath,
        [releaseCli, "validate", "--trigger", trigger, "--source", sourceSha],
        source,
      );
      expect(result.ok).toBe(false);
      expect(result.output).toContain("version");
    } finally {
      await writeFile(lockPath, original);
    }
  });

  it("keeps the credentialed publisher in the exact trusted checkout and downloads only data outside it", async () => {
    const workflow = await readFile(
      join(root, ".github/workflows/release.yml"),
      "utf8",
    );
    const publisher = workflow
      .split("\n  publish:\n")[1]
      .split("\n  consumer:\n")[0];
    expect(publisher).toContain("actions/checkout@");
    expect(publisher).toContain("ref: ${{ github.sha }}");
    expect(publisher).toContain("persist-credentials: false");
    expect(publisher).toContain("path: ${{ runner.temp }}/onolys-common-release");
    expect(publisher).toContain("RELEASE_SOURCE: ${{ github.sha }}");
    expect(publisher).toContain("RELEASE_TRIGGER: ${{ github.ref_name }}");
    expect(publisher).toContain(
      'node scripts/release.mjs publish --directory "$RELEASE_DIRECTORY"',
    );
    expect(publisher).toContain(
      '--source "$RELEASE_SOURCE" --trigger "$RELEASE_TRIGGER"',
    );
    expect(publisher).not.toContain("node release/release.mjs");
    expect(publisher).not.toMatch(/npm (?:ci|install)/);
    expect(workflow).toContain("/onolys-common-release/release.bundle");
    expect(workflow).toContain("/onolys-common-release/release.json");
    expect(workflow).toContain("/onolys-common-release/release-notes.md");
  });

  it.each(["source", "trigger"] as const)(
    "rejects an artifact with mismatched %s before reading its bundle",
    async (field) => {
      const directory = join(fixture, `mismatch-${field}`);
      await mkdir(directory);
      const metadata = {
        repository: "Onolys/onolys-common",
        version: "0.1.0",
        tag: "v0.1.0",
        source: sourceSha,
        trigger,
        commit: "a".repeat(40),
        [field]: field === "source" ? "b".repeat(40) : "release/v0.2.0",
      };
      await writeFile(
        join(directory, "release.json"),
        JSON.stringify(metadata),
      );
      const result = attempt(
        process.execPath,
        [
          releaseCli,
          "publish",
          "--directory",
          directory,
          "--repository",
          "Onolys/onolys-common",
          "--source",
          sourceSha,
          "--trigger",
          trigger,
          "--check-only",
        ],
        source,
      );
      expect(result.ok).toBe(false);
      expect(result.output).toContain("trusted workflow context");
      expect(result.output).not.toContain("release.bundle");
      expect(result.output).not.toContain("GH_TOKEN");
    },
  );

  it("builds only a detached commit, refuses overwrites, and installs it from a real local git remote", async () => {
    const built = join(fixture, "detached");
    run("git", ["clone", "--no-hardlinks", source, built], fixture);
    run("git", ["switch", "--detach", sourceSha], built);
    await symlink(
      join(root, "node_modules"),
      join(built, "node_modules"),
      "dir",
    );
    await writeFile(join(built, ".git/info/exclude"), "node_modules\n");
    const unsafeOutput = attempt(
      process.execPath,
      [
        join(built, "scripts/release.mjs"),
        "build",
        "--trigger",
        trigger,
        "--source",
        sourceSha,
        "--output",
        join(built, "artifact"),
      ],
      built,
    );
    expect(unsafeOutput.ok).toBe(false);
    expect(unsafeOutput.output).toContain("outside the worktree");
    const output = join(fixture, "release-artifact");
    const result = JSON.parse(
      run(
        process.execPath,
        [
          join(built, "scripts/release.mjs"),
          "build",
          "--trigger",
          trigger,
          "--source",
          sourceSha,
          "--output",
          output,
        ],
        built,
      )
        .trim()
        .split("\n")
        .at(-1)!,
    );
    const released = JSON.parse(
      run("git", ["show", `${result.commit}:package.json`], built),
    );
    const lock = JSON.parse(
      run("git", ["show", `${result.commit}:package-lock.json`], built),
    );
    expect(released.version).toBe("0.1.0");
    expect(released.scripts).toBeUndefined();
    expect(released.devDependencies).toBeUndefined();
    expect(lock.packages[""].devDependencies).toBeUndefined();
    expect(lock.version).toBe("0.1.0");
    expect(lock.packages[""].version).toBe("0.1.0");
    expect(run("git", ["rev-parse", `${result.commit}^`], built).trim()).toBe(
      sourceSha,
    );
    expect(
      run(
        "git",
        ["ls-tree", "-r", "--name-only", result.commit, "dist"],
        built,
      ),
    ).toContain("dist/index.js");
    expect(run("git", ["ls-files", "dist"], source)).toBe("");
    expect(run("git", ["rev-parse", "main"], source).trim()).toBe(sourceSha);
    expect(
      JSON.parse(await readFile(join(source, "package.json"), "utf8")).scripts
        .build,
    ).toBeTruthy();
    expect(await readFile(join(output, "release-notes.md"), "utf8")).toContain(
      "Shared design tokens",
    );
    await expect(readFile(join(output, "release.mjs"))).rejects.toThrow();
    const check = JSON.parse(
      run(
        process.execPath,
        [
          releaseCli,
          "publish",
          "--directory",
          output,
          "--repository",
          "Onolys/onolys-common",
          "--source",
          sourceSha,
          "--trigger",
          trigger,
          "--check-only",
        ],
        source,
      ),
    );
    expect(check.validated).toBe(true);
    expect(check.commit).toBe(result.commit);
    const outside = attempt(
      process.execPath,
      [
        releaseCli,
        "publish",
        "--directory",
        output,
        "--repository",
        "elsewhere/unsafe",
        "--source",
        sourceSha,
        "--trigger",
        trigger,
        "--check-only",
      ],
      source,
    );
    expect(outside.ok).toBe(false);
    expect(outside.output).toContain("repository");
    run("git", ["switch", "--detach", sourceSha], built);
    const existing = attempt(
      process.execPath,
      [
        releaseCli,
        "build",
        "--trigger",
        trigger,
        "--source",
        sourceSha,
        "--output",
        join(fixture, "second-artifact"),
      ],
      built,
    );
    expect(existing.ok).toBe(false);
    expect(existing.output).toContain("already exists");
    expect(run("git", ["rev-parse", "v0.1.0"], built).trim()).toBe(
      result.commit,
    );
    const bare = join(fixture, "remote.git");
    run(
      "git",
      ["clone", "--bare", join(output, "release.bundle"), bare],
      fixture,
    );
    run("git", ["update-ref", "refs/heads/main", sourceSha], bare);
    run("git", ["symbolic-ref", "HEAD", "refs/heads/main"], bare);
    const specifier = `git+${pathToFileURL(bare).href}#v0.1.0`;
    const smoke = JSON.parse(
      run(
        process.execPath,
        [join(built, "scripts/release-smoke.mjs"), "--spec", specifier],
        root,
      )
        .trim()
        .split("\n")
        .at(-1)!,
    );
    expect(smoke).toMatchObject({
      version: "0.1.0",
      noBuildScripts: true,
      exports: 8,
      button: "teal",
      dialog: true,
      cspViolations: 0,
    });
  }, 180_000);
});
