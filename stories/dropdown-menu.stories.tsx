import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/DropdownMenu", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;

function MenuExample({ open = false, submenu = false }: { open?: boolean; submenu?: boolean }) {
  return <UI.DropdownMenu defaultOpen={open}><UI.DropdownMenuTrigger asChild><UI.Button variant="outline">Actions</UI.Button></UI.DropdownMenuTrigger><UI.DropdownMenuContent><UI.DropdownMenuLabel>Actions</UI.DropdownMenuLabel><UI.DropdownMenuGroup><UI.DropdownMenuItem>Edit<UI.DropdownMenuShortcut>Ctrl+E</UI.DropdownMenuShortcut></UI.DropdownMenuItem><UI.DropdownMenuItem disabled>Unavailable</UI.DropdownMenuItem><UI.DropdownMenuItem variant="destructive">Remove</UI.DropdownMenuItem></UI.DropdownMenuGroup><UI.DropdownMenuSeparator /><UI.DropdownMenuCheckboxItem checked>Show details</UI.DropdownMenuCheckboxItem><UI.DropdownMenuRadioGroup value="compact" aria-label="Density"><UI.DropdownMenuRadioItem value="compact">Compact</UI.DropdownMenuRadioItem><UI.DropdownMenuRadioItem value="comfortable">Comfortable</UI.DropdownMenuRadioItem></UI.DropdownMenuRadioGroup><UI.DropdownMenuSub defaultOpen={submenu}><UI.DropdownMenuSubTrigger>More</UI.DropdownMenuSubTrigger><UI.DropdownMenuSubContent><UI.DropdownMenuItem>Download</UI.DropdownMenuItem></UI.DropdownMenuSubContent></UI.DropdownMenuSub></UI.DropdownMenuContent></UI.DropdownMenu>;
}

export const Closed: Story = { render: () => (<MenuExample />) };

export const Open: Story = { render: () => (<MenuExample open />) };

export const SubmenuOpen: Story = { render: () => (<MenuExample open submenu />) };
