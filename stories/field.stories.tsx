import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "Onolys/Field", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => (<UI.Field label="Email">{(id) => <UI.Input id={id} type="email" autoComplete="email" />}</UI.Field>) };

export const WithSelect: Story = { render: () => (<UI.Field label="Language">{(id) => <UI.Select id={id} defaultValue="en"><option value="en">English</option><option value="fr">French</option></UI.Select>}</UI.Field>) };
