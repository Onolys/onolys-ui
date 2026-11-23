import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Separator", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Horizontal: Story = { render: () => (<div className="space-y-4"><p>First section</p><UI.Separator /><p>Second section</p></div>) };

export const Vertical: Story = { render: () => (<div className="flex h-12 items-center gap-4"><span>First</span><UI.Separator orientation="vertical" /><span>Second</span></div>) };
