import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/AlertDialog", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;

function AlertExample({ open = false, size = "default" }: { open?: boolean; size?: "default" | "sm" }) {
  return <UI.AlertDialog defaultOpen={open}><UI.AlertDialogTrigger asChild><UI.Button variant="destructive">Remove item</UI.Button></UI.AlertDialogTrigger><UI.AlertDialogContent size={size}><UI.AlertDialogHeader><UI.AlertDialogMedia aria-hidden="true">!</UI.AlertDialogMedia><UI.AlertDialogTitle>Remove this item?</UI.AlertDialogTitle><UI.AlertDialogDescription>This cannot be undone.</UI.AlertDialogDescription></UI.AlertDialogHeader><UI.AlertDialogFooter><UI.AlertDialogCancel>Keep item</UI.AlertDialogCancel><UI.AlertDialogAction variant="destructive">Remove</UI.AlertDialogAction></UI.AlertDialogFooter></UI.AlertDialogContent></UI.AlertDialog>;
}

export const Closed: Story = { render: () => (<AlertExample />) };

export const Open: Story = { render: () => (<AlertExample open />) };

export const Compact: Story = { render: () => (<AlertExample open size="sm" />) };
