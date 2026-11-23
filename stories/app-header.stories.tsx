import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "Onolys/AppHeader", parameters: { ownLandmarks: true } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Full: Story = { render: () => (<><UI.AppHeader brand={<a href="#home">Example</a>} navigation={<a href="#sessions">Sessions</a>} accountMenu={<UI.Button variant="outline">Account</UI.Button>} /><UI.Page><h1>Welcome</h1></UI.Page></>) };

export const BrandOnly: Story = { render: () => (<><UI.AppHeader brand={<a href="#home">Example</a>} /><UI.Page><h1>Welcome</h1></UI.Page></>) };
