import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Alert", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Default: Story = { render: () => (<UI.Alert><UI.AlertTitle>Changes saved</UI.AlertTitle><UI.AlertDescription>Your preferences have been updated.</UI.AlertDescription></UI.Alert>) };

export const Destructive: Story = { render: () => (<UI.Alert variant="destructive"><UI.AlertTitle>Save failed</UI.AlertTitle><UI.AlertDescription>Try saving your changes again.</UI.AlertDescription></UI.Alert>) };
