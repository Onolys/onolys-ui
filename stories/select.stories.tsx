import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Select", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Default: Story = { render: () => (<div className="max-w-sm space-y-2"><UI.Label htmlFor="choice">View</UI.Label><UI.Select id="choice" defaultValue="summary"><option value="summary">Summary</option><option value="details">Details</option></UI.Select></div>) };

export const Keyboard: Story = { render: () => (<div className="max-w-sm space-y-2"><UI.Label htmlFor="keyboard-choice">View</UI.Label><UI.Select id="keyboard-choice" defaultValue="summary"><option value="summary">Summary</option><option value="details">Details</option></UI.Select></div>) };

export const InvalidAndDisabled: Story = { render: () => (<div className="max-w-sm space-y-4"><UI.Label htmlFor="invalid-choice">Required view</UI.Label><UI.Select id="invalid-choice" aria-invalid="true" aria-describedby="view-error" defaultValue=""><option value="">Choose a view</option><option value="summary">Summary</option></UI.Select><p id="view-error">Choose a view.</p><UI.Label htmlFor="disabled-choice">Unavailable view</UI.Label><UI.Select id="disabled-choice" disabled><option>Summary</option></UI.Select></div>) };
