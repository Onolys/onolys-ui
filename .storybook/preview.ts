import type { Preview } from "@storybook/react-vite";
import "../stories/styles.css";

const preview: Preview = {
  parameters: { a11y: { test: "error" } },
};

export default preview;
