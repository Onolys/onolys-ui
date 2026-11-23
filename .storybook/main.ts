import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
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
