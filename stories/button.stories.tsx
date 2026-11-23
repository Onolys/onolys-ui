import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Button", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Default: Story = { render: () => (<UI.Button>Continue</UI.Button>) };

export const Variants: Story = { render: () => (<div className="flex flex-wrap gap-4">{(["default", "secondary", "destructive", "outline", "ghost", "link"] as const).map((variant) => <UI.Button key={variant} variant={variant}>{variant}</UI.Button>)}</div>) };

export const Sizes: Story = { render: () => (<div className="flex flex-wrap items-center gap-4">{(["default", "xs", "sm", "lg"] as const).map((size) => <UI.Button key={size} size={size}>{size}</UI.Button>)}{(["icon", "icon-xs", "icon-sm", "icon-lg"] as const).map((size) => <UI.Button key={size} size={size} aria-label={`Add ${size}`}><span aria-hidden="true">+</span></UI.Button>)}</div>) };

export const Disabled: Story = { render: () => (<UI.Button disabled>Unavailable</UI.Button>) };

export const KeyboardFocus: Story = { render: () => (<UI.Button>Keyboard action</UI.Button>) };
