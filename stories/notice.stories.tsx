import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "Onolys/Notice", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Info: Story = { render: () => (<UI.Notice>Your report is being prepared.</UI.Notice>) };

export const Error: Story = { render: () => (<UI.ErrorNote>We could not save your changes. Try again.</UI.ErrorNote>) };
