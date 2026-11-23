import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Dialog", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;

function DialogExample({ open = false }: { open?: boolean }) {
  return <UI.Dialog defaultOpen={open}><UI.DialogTrigger asChild><UI.Button>Open dialog</UI.Button></UI.DialogTrigger><UI.DialogContent><UI.DialogHeader><UI.DialogTitle>Edit preferences</UI.DialogTitle><UI.DialogDescription>Choose your display preferences.</UI.DialogDescription></UI.DialogHeader><UI.Label htmlFor="display-name">Display name</UI.Label><UI.Input id="display-name" defaultValue="Example" /><UI.DialogFooter><UI.DialogClose asChild><UI.Button variant="outline">Cancel</UI.Button></UI.DialogClose><UI.Button>Save</UI.Button></UI.DialogFooter></UI.DialogContent></UI.Dialog>;
}

export const Closed: Story = { render: () => (<DialogExample />) };

export const Open: Story = { render: () => (<DialogExample open />) };
