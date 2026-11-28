import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "Onolys/ErrorRecovery", parameters: { ownLandmarks: true } } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => (<UI.Page><UI.ErrorRecovery status={500} reference="req-1234" reload={() => {}} /></UI.Page>) };

export const NotFound: Story = { render: () => (<UI.Page><UI.ErrorRecovery status={404} reload={() => {}} /></UI.Page>) };
