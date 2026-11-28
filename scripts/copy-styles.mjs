import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

await mkdir("dist", { recursive: true });
await Promise.all([
  ...["theme", "base", "fonts"].map(async (name) => {
    const source = await readFile(`src/styles/${name}.css`, "utf8");
    // CSS moves from src/styles/ to dist/; fonts remain in the package fonts/ folder.
    const css = source
      .replaceAll('../tokens/tokens.css', './tokens.css')
      .replaceAll('../../fonts/', '../fonts/');
    await writeFile(`dist/${name}.css`, css);
  }),
  copyFile("src/tokens/tokens.css", "dist/tokens.css"),
  // theme-init.js: classic pre-paint script; its storage key is read from src/constants.ts (the single source).
  (async () => {
    const constants = await readFile("src/constants.ts", "utf8");
    const key = constants.match(/THEME_STORAGE_KEY\s*=\s*("[^"]+")/)?.[1];
    if (!key) throw new Error("THEME_STORAGE_KEY not found in src/constants.ts");
    const template = await readFile("scripts/theme-init.template.js", "utf8");
    await writeFile("dist/theme-init.js", template.replace("__THEME_STORAGE_KEY__", key));
  })(),
]);
