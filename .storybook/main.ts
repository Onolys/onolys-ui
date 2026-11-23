import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const config: StorybookConfig = {
  stories: process.env.STORYBOOK_A11Y_NEGATIVE === "1"
    ? ["../test/fixtures/a11y-negative.stories.tsx"]
    : ["../stories/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/react-vite",
  addons: ["@storybook/addon-a11y"],
  core: { disableTelemetry: true },
  async viteFinal(config) {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          "@": fileURLToPath(new URL("../src", import.meta.url)),
        },
      },
      plugins: [...(config.plugins ?? []), tailwindcss()],
    };
  },
};

export default config;
