import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "Onolys/Footer", parameters: { ownLandmarks: true } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Default: Story = { render: () => (<><UI.Page><h1>Example page</h1></UI.Page><UI.Footer notices={<p>Example service notice.</p>} links={<><a href="#privacy">Privacy</a><a href="#terms">Terms</a></>} copyright="© 2026 Example"><p>Contact the team for help.</p></UI.Footer></>) };
