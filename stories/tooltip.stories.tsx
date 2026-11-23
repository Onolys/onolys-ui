import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Tooltip", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;

function TooltipExample({ open = false }: { open?: boolean }) {
  return <UI.TooltipProvider delayDuration={0}><UI.Tooltip {...(open ? { defaultOpen: true } : {})}><UI.TooltipTrigger asChild><UI.Button variant="outline">More information</UI.Button></UI.TooltipTrigger><UI.TooltipContent>Additional context for this action.</UI.TooltipContent></UI.Tooltip></UI.TooltipProvider>;
}

export const Keyboard: Story = { render: () => (<TooltipExample />) };

export const Open: Story = { render: () => (<TooltipExample open />) };
