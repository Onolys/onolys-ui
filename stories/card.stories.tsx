import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Card", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Default: Story = { render: () => (<UI.Card className="max-w-md"><UI.CardHeader><UI.CardTitle>Account</UI.CardTitle><UI.CardDescription>Update your preferences.</UI.CardDescription><UI.CardAction><UI.Badge>New</UI.Badge></UI.CardAction></UI.CardHeader><UI.CardContent><p>Your preferences are ready.</p></UI.CardContent><UI.CardFooter><UI.Button>Continue</UI.Button></UI.CardFooter></UI.Card>) };
