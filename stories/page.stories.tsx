import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "Onolys/Page", parameters: { ownLandmarks: true } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Default: Story = { render: () => (<UI.Page><h1>Example page</h1><p>Main page content.</p></UI.Page>) };
