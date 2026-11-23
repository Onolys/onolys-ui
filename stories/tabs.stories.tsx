import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Tabs", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;

function TabsExample({ orientation = "horizontal", variant = "default" }: { orientation?: "horizontal" | "vertical"; variant?: "default" | "line" }) {
  return <UI.Tabs defaultValue="summary" orientation={orientation}><UI.TabsList aria-label="Report views" variant={variant}><UI.TabsTrigger value="summary">Summary</UI.TabsTrigger><UI.TabsTrigger value="details">Details</UI.TabsTrigger><UI.TabsTrigger value="locked" disabled>Unavailable</UI.TabsTrigger></UI.TabsList><UI.TabsContent value="summary">Summary content</UI.TabsContent><UI.TabsContent value="details">Detailed content</UI.TabsContent></UI.Tabs>;
}

export const Horizontal: Story = { render: () => (<TabsExample />) };

export const Vertical: Story = { render: () => (<TabsExample orientation="vertical" />) };

export const Line: Story = { render: () => (<TabsExample variant="line" />) };
