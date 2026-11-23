import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Input", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Default: Story = { render: () => (<div className="max-w-sm space-y-2"><UI.Label htmlFor="name">Name</UI.Label><UI.Input id="name" autoComplete="name" placeholder="Your name" /></div>) };

export const InvalidAndDisabled: Story = { render: () => (<div className="max-w-sm space-y-4"><UI.Label htmlFor="invalid-input">Email</UI.Label><UI.Input id="invalid-input" aria-invalid="true" aria-describedby="email-error" defaultValue="invalid" /><p id="email-error">Enter an email address.</p><UI.Label htmlFor="disabled-input">Unavailable value</UI.Label><UI.Input id="disabled-input" disabled defaultValue="Read only" /></div>) };
