import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "Onolys/AccountMenu", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => (<UI.AccountMenu email="person@example.com" links={[{ href: "#settings", label: "Settings" }]} onSignOut={() => {}} />) };

export const NoLinks: Story = { render: () => (<UI.AccountMenu email="person@example.com" onSignOut={() => {}} />) };
