import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Skeleton", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Loading: Story = { render: () => (<div role="status" aria-label="Loading account" className="max-w-sm space-y-3"><UI.Skeleton className="h-12 w-12 rounded-full" /><UI.Skeleton className="h-4 w-full" /><UI.Skeleton className="h-4 w-2/3" /><span className="sr-only">Loading account</span></div>) };
