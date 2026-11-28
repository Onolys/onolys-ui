import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "Onolys/SlowStartNotice", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Visible: Story = { render: () => (<UI.SlowStartNotice pending delayMs={0} />) };

export const Idle: Story = { render: () => (<><UI.SlowStartNotice pending={false} /><p>Nothing pending, so no notice is shown.</p></>) };
