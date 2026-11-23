import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

await mkdir("dist", { recursive: true });
await Promise.all([
  ...["theme", "base", "fonts", "legacy"].map(async (name) => {
    const source = await readFile(`src/styles/${name}.css`, "utf8");
    // CSS moves from src/styles/ to dist/; fonts remain in the package fonts/ folder.
    const css = source
      .replaceAll('../tokens/tokens.css', './tokens.css')
      .replaceAll('../../fonts/', '../fonts/');
    await writeFile(`dist/${name}.css`, css);
  }),
  copyFile("src/tokens/tokens.css", "dist/tokens.css"),
]);
