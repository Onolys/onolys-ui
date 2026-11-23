import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../src/components/ui/button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: { children: "Continue" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
