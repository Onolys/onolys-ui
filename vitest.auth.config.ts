import { defineConfig } from "vitest/config";

/** Emulator suite only (`npm run test:auth`, run under `firebase emulators:exec`). Mirrors vitest.config.ts minus its emulator exclude. */
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.emulator.test.{ts,tsx}"],
  },
});
