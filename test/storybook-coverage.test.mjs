import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { assertStoryCoverage } from "../scripts/storybook-coverage.mjs";

test("built Storybook lists every supported component family", async () => {
  const index = JSON.parse(await readFile(new URL("../storybook-static/index.json", import.meta.url), "utf8"));
  assertStoryCoverage(index);
});
