import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "Onolys/ScoreBadge", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Variants: Story = { render: () => (<div className="flex flex-wrap gap-4"><UI.ScoreBadge variant="good">4.2</UI.ScoreBadge><UI.ScoreBadge variant="fair">3.1</UI.ScoreBadge><UI.ScoreBadge variant="low">2.0</UI.ScoreBadge></div>) };
