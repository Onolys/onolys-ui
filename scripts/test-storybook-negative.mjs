import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const output = await mkdtemp(join(tmpdir(), "onolys-storybook-negative-"));
try {
  const build = spawnSync("npm", ["run", "build:storybook", "--", "--output-dir", output], {
    env: { ...process.env, STORYBOOK_A11Y_NEGATIVE: "1" }, encoding: "utf8", maxBuffer: 32 * 1024 * 1024,
  });
  assert.equal(build.status, 0, build.stderr + build.stdout);
  const run = spawnSync(process.execPath, ["scripts/test-storybook-a11y.mjs", "--dir", output, "--negative-fixture"], {
    encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
  });
  console.log(run.stdout);
  console.log(run.stderr);
  assert.equal(run.status, 1, "A known bad story must make the same axe runner fail");
  assert.match(run.stderr, /FAIL light validation-negative--missing-name:.*button-name/);
  assert.match(run.stderr, /FAIL dark validation-negative--missing-name:.*button-name/);
  console.log("PASS: isolated missing-name story makes axe fail in light and dark.");
} finally { await rm(output, { recursive: true, force: true }); }
