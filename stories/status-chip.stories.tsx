import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "Onolys/StatusChip", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;

const tones = ["progress", "wait", "done", "failed", "agree", "differs", "flagged", "neutral", "muted"] as const;

export const Tones: Story = { render: () => (<ul className="flex flex-wrap gap-2">{tones.map((tone) => (<li key={tone}><UI.StatusChip tone={tone}>{tone}</UI.StatusChip></li>))}</ul>) };
