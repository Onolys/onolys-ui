import { createElement } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

// Only indexed for the opt-in negative build; never part of the normal catalogue.
export default { title: "Validation/Negative" } satisfies Meta;
export const MissingName: StoryObj = {
  render: () => createElement("button", { type: "button", className: "size-11" }, createElement("span", { "aria-hidden": true }, "×")),
};
