import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Badge", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Variants: Story = { render: () => (<div className="flex flex-wrap gap-4">{(["default", "secondary", "destructive", "outline", "ghost", "link"] as const).map((variant) => <UI.Badge key={variant} variant={variant}>{variant}</UI.Badge>)}</div>) };

export const Link: Story = { render: () => (<UI.Badge asChild><a href="#details">Read details</a></UI.Badge>) };
