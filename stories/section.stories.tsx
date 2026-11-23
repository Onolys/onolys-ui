import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "Onolys/Section", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Default: Story = { render: () => (<UI.Section aria-labelledby="section-heading"><h2 id="section-heading">Details</h2><p>A named content region.</p></UI.Section>) };
