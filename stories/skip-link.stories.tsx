import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "Onolys/SkipLink", parameters: { ownLandmarks: true } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Keyboard: Story = { render: () => (<><UI.SkipLink /><UI.Page><h1>Main content</h1><p>Activate the skip link with the keyboard.</p><UI.Button>Continue</UI.Button></UI.Page></>) };
