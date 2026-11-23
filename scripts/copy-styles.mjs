import { copyFile, mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });
await Promise.all([
  ...["theme", "base", "fonts"].map((name) =>
    copyFile(`src/styles/${name}.css`, `dist/${name}.css`),
  ),
  copyFile("src/tokens/tokens.css", "dist/tokens.css"),
]);
