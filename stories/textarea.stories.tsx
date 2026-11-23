import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Textarea", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Default: Story = { render: () => (<div className="max-w-sm space-y-2"><UI.Label htmlFor="notes">Notes</UI.Label><UI.Textarea id="notes" placeholder="Add a note" /></div>) };

export const InvalidAndDisabled: Story = { render: () => (<div className="max-w-sm space-y-4"><UI.Label htmlFor="invalid-notes">Required note</UI.Label><UI.Textarea id="invalid-notes" aria-invalid="true" aria-describedby="note-error" /><p id="note-error">Add a note before continuing.</p><UI.Label htmlFor="disabled-notes">Locked note</UI.Label><UI.Textarea id="disabled-notes" disabled defaultValue="Unavailable" /></div>) };
