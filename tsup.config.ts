import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "tokens/tokens": "src/tokens/tokens.ts",
    "auth/index": "src/auth/index.ts",
    "auth/firebase": "src/auth/firebase.ts",
    "auth/testing": "src/auth/testing.ts",
  },
  format: ["esm"],
  target: "es2022",
  dts: true,
  sourcemap: true,
  clean: true,
  // Shared chunks: the root and auth entries load one copy of each component.
  splitting: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "react-router",
    "@tanstack/react-query",
    /^firebase(\/.*)?$/,
  ],
});
