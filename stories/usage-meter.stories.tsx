import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "Onolys/UsageMeter", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Available: Story = { render: () => (<UI.UsageMeter label="Daily allowance" used={2} cap={5} periodLabel="today" />) };

export const Exhausted: Story = { render: () => (<UI.UsageMeter label="Daily allowance" used={5} cap={5} periodLabel="today" />) };

export const ZeroAllowance: Story = { render: () => (<UI.UsageMeter label="Daily allowance" used={0} cap={0} periodLabel="today" />) };
