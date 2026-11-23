import type { Meta, StoryObj } from "@storybook/react-vite";
import { Smoke } from "../src/components/smoke";

const meta = {
  title: "Scaffold/Smoke",
  component: Smoke,
  args: { children: "Onolys UI scaffold" },
} satisfies Meta<typeof Smoke>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
