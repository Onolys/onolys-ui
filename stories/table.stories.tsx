import type { Meta, StoryObj } from "@storybook/react-vite";
import * as UI from "../src/index";

const meta = { title: "UI/Table", parameters: { ownLandmarks: false } } satisfies Meta;
export default meta;
type Story = StoryObj;


export const Default: Story = { render: () => (<UI.Table><UI.TableCaption>Example weekly activity</UI.TableCaption><UI.TableHeader><UI.TableRow><UI.TableHead scope="col">Day</UI.TableHead><UI.TableHead scope="col">Count</UI.TableHead></UI.TableRow></UI.TableHeader><UI.TableBody><UI.TableRow><UI.TableCell>Monday</UI.TableCell><UI.TableCell>2</UI.TableCell></UI.TableRow><UI.TableRow data-state="selected"><UI.TableCell>Tuesday</UI.TableCell><UI.TableCell>3</UI.TableCell></UI.TableRow></UI.TableBody><UI.TableFooter><UI.TableRow><UI.TableCell>Total</UI.TableCell><UI.TableCell>5</UI.TableCell></UI.TableRow></UI.TableFooter></UI.Table>) };
