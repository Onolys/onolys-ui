import type { Preview } from "@storybook/react-vite";
import "../stories/styles.css";

const preview: Preview = {
  // The serial Playwright runner owns automated scans; avoid overlapping axe engines.
  initialGlobals: { a11y: { manual: true } },
  parameters: { layout: "fullscreen", a11y: { test: "error" } },
  decorators: [(Story, context) => (
    <div data-story-frame className="min-h-screen bg-background text-foreground">
      {context.parameters.ownLandmarks ? <Story /> : (
        <main className="space-y-6 p-8">
          <h1 className="text-2xl font-semibold">{context.title.split("/").at(-1)}</h1>
          <Story />
        </main>
      )}
    </div>
  )],
};

export default preview;
