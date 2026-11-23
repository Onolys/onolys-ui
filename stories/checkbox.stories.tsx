import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Checkbox", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Default: Story = { render: () => (<div className="flex items-center gap-3"><UI.Checkbox id="notifications" /><UI.Label htmlFor="notifications">Use notifications</UI.Label></div>) };

export const States: Story = { render: () => (<div className="space-y-4">{(["checked", "unchecked", "indeterminate", "disabled"] as const).map((state) => <div key={state} className="flex items-center gap-3"><UI.Checkbox id={state} defaultChecked={state === "checked" ? true : state === "indeterminate" ? "indeterminate" : false} disabled={state === "disabled"} /><UI.Label htmlFor={state}>{state}</UI.Label></div>)}</div>) };
