import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Label", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Default: Story = { render: () => (<div className="max-w-sm space-y-2"><UI.Label htmlFor="label-example">Display name</UI.Label><UI.Input id="label-example" /></div>) };
