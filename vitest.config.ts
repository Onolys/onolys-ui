import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Emulator tests need the Firebase Auth emulator: `npm run test:auth` runs them.
    exclude: [...configDefaults.exclude, "**/*.emulator.test.*"],
  },
});
