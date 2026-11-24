import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Progress", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => (<div className="max-w-sm space-y-2"><UI.Progress value={40} aria-label="Overall progress" aria-valuetext="40 percent" /><p className="text-sm text-muted-foreground">40%</p></div>) };

export const Empty: Story = { render: () => (<div className="max-w-sm"><UI.Progress value={0} aria-label="Upload progress" aria-valuetext="0 percent" /></div>) };

export const Complete: Story = { render: () => (<div className="max-w-sm"><UI.Progress value={100} aria-label="Overall progress" aria-valuetext="100 percent" /></div>) };
