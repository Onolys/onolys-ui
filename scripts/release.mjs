import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  appendFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { parseArgs } from "node:util";

const repository = "Onolys/onolys-common";
const sha = /^[a-f0-9]{40}$/;
const versionPattern = "(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)";
function git(cwd, args, env = process.env) {
  return execFileSync("git", args, {
    cwd,
    env,
    encoding: "utf8",
    stdio: "pipe",
  }).trim();
}
function existsRef(cwd, ref) {
  try {
    return git(cwd, ["rev-parse", "--verify", ref]);
  } catch {
    return null;
  }
}
function notesFor(changelog, version) {
  const headings = [
    ...changelog.matchAll(/^## \[([^\]]+)\](?: - (\d{4}-\d{2}-\d{2}))?\s*$/gm),
  ];
  const matches = headings.filter((heading) => heading[1] === version);
  if (
    matches.length !== 1 ||
    !matches[0][2] ||
    !headings.some((heading) => heading[1] === "Unreleased")
  )
    throw new Error(
      "CHANGELOG must contain Unreleased and one dated release section",
    );
  const heading = matches[0];
  const next = headings[headings.indexOf(heading) + 1];
  const body = changelog
    .slice(heading.index + heading[0].length, next?.index)
    .trim();
  if (
    !body ||
    !/^### (Added|Changed|Deprecated|Removed|Fixed|Security)\s*$/m.test(body)
  )
    throw new Error(
      "CHANGELOG release notes must contain a Keep a Changelog section",
    );
  return `${heading[0].trim()}\n\n${body}\n`;
}
function releaseIdentity(trigger, source) {
  const match = new RegExp(`^release/v${versionPattern}$`).exec(trigger ?? "");
  if (!match)
    throw new Error(
      "Invalid release trigger; expected release/vX.Y.Z with stable semver",
    );
  if (!sha.test(source ?? "")) throw new Error("Invalid source commit");
  const version = trigger.slice("release/v".length);
  return { repository, trigger, version, tag: `v${version}`, source };
}
async function validate(cwd, trigger, source) {
  const info = releaseIdentity(trigger, source);
  if (
    git(cwd, ["rev-parse", "HEAD"]) !== source ||
    existsRef(cwd, `refs/tags/${trigger}^{commit}`) !== source
  )
    throw new Error("Trigger must name the exact checked-out source commit");
  const manifest = JSON.parse(
    await readFile(join(cwd, "package.json"), "utf8"),
  );
  const lock = JSON.parse(
    await readFile(join(cwd, "package-lock.json"), "utf8"),
  );
  if (
    manifest.name !== "@onolys/common" ||
    manifest.version !== info.version ||
    lock.version !== info.version ||
    lock.packages?.[""]?.version !== info.version
  )
    throw new Error(
      "Release version must match package.json and package-lock.json",
    );
  if (manifest.scripts?.prepare || manifest.workspaces)
    throw new Error("Source must not contain prepare or workspaces");
  if (git(cwd, ["ls-files", "dist"]))
    throw new Error("The source commit must not track dist");
  const notes = notesFor(
    await readFile(join(cwd, "CHANGELOG.md"), "utf8"),
    info.version,
  );
  return { info, manifest, lock, notes };
}
function releaseManifests(manifest, lock) {
  const packaged = structuredClone(manifest);
  const locked = structuredClone(lock);
  delete packaged.scripts;
  delete packaged.devDependencies;
  delete locked.packages[""].devDependencies;
  return { packaged, locked };
}
async function build(cwd, values) {
  const { info, manifest, lock, notes } = await validate(
    cwd,
    values.trigger,
    values.source,
  );
  if (
    existsRef(cwd, "HEAD") &&
    git(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]) !== "HEAD"
  )
    throw new Error("Release builds require detached HEAD");
  if (existsRef(cwd, `refs/tags/${info.tag}`))
    throw new Error(`${info.tag} already exists; refusing to overwrite it`);
  if (git(cwd, ["status", "--porcelain"]))
    throw new Error("Release build requires a clean worktree");
  if (git(cwd, ["rev-parse", "--is-shallow-repository"]) !== "false")
    throw new Error("Release bundles require a full checkout");
  if (!values.output)
    throw new Error("An external output directory is required");
  const output = resolve(values.output);
  const parent = await realpath(dirname(output));
  if (
    !relative(await realpath(cwd), join(parent, basename(output))).startsWith(
      `..${sep}`,
    )
  )
    throw new Error("Release output directory must be outside the worktree");
  await mkdir(output);
  execFileSync("npm", ["run", "build"], { cwd, stdio: "inherit" });
  const { packaged, locked } = releaseManifests(manifest, lock);
  await writeFile(
    join(cwd, "package.json"),
    JSON.stringify(packaged, null, 2) + "\n",
  );
  await writeFile(
    join(cwd, "package-lock.json"),
    JSON.stringify(locked, null, 2) + "\n",
  );
  git(cwd, ["add", "package.json", "package-lock.json"]);
  git(cwd, ["add", "--force", "dist"]);
  git(cwd, [
    "-c",
    "user.name=onolys-common release",
    "-c",
    "user.email=41898282+github-actions[bot]@users.noreply.github.com",
    "commit",
    "-m",
    `Release ${info.tag} from ${info.source}`,
  ]);
  const commit = git(cwd, ["rev-parse", "HEAD"]);
  git(cwd, ["tag", info.tag, commit]);
  git(cwd, [
    "bundle",
    "create",
    join(output, "release.bundle"),
    `refs/tags/${info.tag}`,
  ]);
  const metadata = { ...info, commit };
  await writeFile(
    join(output, "release.json"),
    JSON.stringify(metadata, null, 2) + "\n",
  );
  await writeFile(join(output, "release-notes.md"), notes);
  return metadata;
}
async function inspectArtifact(
  directory,
  expectedRepository,
  expectedIdentity,
  use,
) {
  if (expectedRepository !== repository)
    throw new Error(`Release repository must be ${repository}`);
  const artifact = resolve(directory ?? "");
  for (const name of ["release.json"])
    if (!(await lstat(join(artifact, name))).isFile())
      throw new Error("Release artifact must contain regular files");
  const metadata = JSON.parse(
    await readFile(join(artifact, "release.json"), "utf8"),
  );
  if (
    metadata.source !== expectedIdentity.source ||
    metadata.trigger !== expectedIdentity.trigger
  )
    throw new Error(
      "Release artifact source and trigger must match the trusted workflow context",
    );
  const info = expectedIdentity;
  for (const name of ["release.bundle", "release-notes.md"])
    if (!(await lstat(join(artifact, name))).isFile())
      throw new Error("Release artifact must contain regular files");
  if (
    metadata.repository !== repository ||
    metadata.tag !== info.tag ||
    metadata.version !== info.version ||
    !sha.test(metadata.commit ?? "")
  )
    throw new Error("Invalid release artifact metadata");
  const temporary = await mkdtemp(join(tmpdir(), "onolys-publish-"));
  try {
    git(temporary, ["init", "--quiet"]);
    git(temporary, [
      "fetch",
      join(artifact, "release.bundle"),
      `refs/tags/${info.tag}:refs/tags/${info.tag}`,
    ]);
    if (
      git(temporary, ["rev-parse", `refs/tags/${info.tag}`]) !==
        metadata.commit ||
      git(temporary, ["rev-list", "--parents", "-n", "1", metadata.commit]) !==
        `${metadata.commit} ${info.source}`
    )
      throw new Error(
        "Release commit must be a direct child of the gated source",
      );
    const changed = git(temporary, [
      "diff",
      "--name-only",
      info.source,
      metadata.commit,
    ]).split("\n");
    if (
      !changed.some((path) => path.startsWith("dist/")) ||
      changed.some(
        (path) =>
          path !== "package.json" &&
          path !== "package-lock.json" &&
          !path.startsWith("dist/"),
      )
    )
      throw new Error(
        "Release commit may change only dist and release manifest metadata",
      );
    const sourceManifest = JSON.parse(
      git(temporary, ["show", `${info.source}:package.json`]),
    );
    const sourceLock = JSON.parse(
      git(temporary, ["show", `${info.source}:package-lock.json`]),
    );
    if (
      sourceManifest.version !== info.version ||
      sourceLock.version !== info.version ||
      sourceLock.packages?.[""]?.version !== info.version
    )
      throw new Error("Release artifact version must match its source");
    const expected = releaseManifests(sourceManifest, sourceLock);
    assert.deepEqual(
      JSON.parse(git(temporary, ["show", `${metadata.commit}:package.json`])),
      expected.packaged,
    );
    assert.deepEqual(
      JSON.parse(
        git(temporary, ["show", `${metadata.commit}:package-lock.json`]),
      ),
      expected.locked,
    );
    const notes = await readFile(join(artifact, "release-notes.md"), "utf8");
    assert.equal(
      notes,
      notesFor(
        git(temporary, ["show", `${info.source}:CHANGELOG.md`]),
        info.version,
      ),
    );
    return await use({ metadata, notes, temporary });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
async function publish(values) {
  return inspectArtifact(
    values.directory,
    values.repository,
    releaseIdentity(values.trigger, values.source),
    async ({ metadata, notes, temporary }) => {
      if (values["check-only"]) return { validated: true, ...metadata };
      const token = process.env.GH_TOKEN;
      if (!token) throw new Error("GH_TOKEN is required only for publication");
      const remote = `https://github.com/${repository}.git`;
      const env = {
        ...process.env,
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_TERMINAL_PROMPT: "0",
        GIT_CONFIG_COUNT: "1",
        GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
        GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}`,
      };
      const existing = git(
        temporary,
        ["ls-remote", "--refs", remote, `refs/tags/${metadata.tag}`],
        env,
      ).split(/\s/)[0];
      if (existing && existing !== metadata.commit)
        throw new Error(
          `${metadata.tag} already exists at a different commit; refusing to overwrite it`,
        );
      if (!existing)
        git(
          temporary,
          [
            "push",
            remote,
            `refs/tags/${metadata.tag}:refs/tags/${metadata.tag}`,
          ],
          env,
        );
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      };
      const endpoint = `https://api.github.com/repos/${repository}/releases`;
      const found = await fetch(`${endpoint}/tags/${metadata.tag}`, {
        headers,
      });
      if (found.ok)
        return {
          ...metadata,
          url: (await found.json()).html_url,
          existing: true,
        };
      if (found.status !== 404)
        throw new Error(`GitHub release lookup failed: HTTP ${found.status}`);
      const created = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          tag_name: metadata.tag,
          name: metadata.tag,
          target_commitish: metadata.commit,
          body: notes,
          draft: false,
          prerelease: false,
        }),
      });
      if (!created.ok)
        throw new Error(
          `GitHub release creation failed: HTTP ${created.status}`,
        );
      return { ...metadata, url: (await created.json()).html_url };
    },
  );
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    trigger: { type: "string" },
    source: { type: "string" },
    output: { type: "string" },
    directory: { type: "string" },
    repository: { type: "string" },
    "check-only": { type: "boolean" },
    "github-output": { type: "string" },
  },
});
try {
  const command = positionals[0];
  let result;
  if (command === "validate")
    result = (await validate(process.cwd(), values.trigger, values.source))
      .info;
  else if (command === "build") result = await build(process.cwd(), values);
  else if (command === "publish") result = await publish(values);
  else throw new Error("Expected validate, build, or publish command");
  if (values["github-output"])
    await appendFile(
      values["github-output"],
      Object.entries(result)
        .filter(([name]) =>
          ["version", "tag", "source", "commit"].includes(name),
        )
        .map(([name, value]) => `${name}=${value}\n`)
        .join(""),
    );
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
