import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Spinner", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => (<p className="flex items-center gap-2 text-primary"><UI.Spinner /><span>In progress</span></p>) };

export const Large: Story = { render: () => (<p className="flex items-center gap-3 text-foreground"><UI.Spinner className="size-8" /><span>Working on your report</span></p>) };
