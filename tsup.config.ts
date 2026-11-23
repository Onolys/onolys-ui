import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", "tokens/tokens": "src/tokens/tokens.ts" },
  format: ["esm"],
  target: "es2022",
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ["react", "react-dom", "react/jsx-runtime"],
});
