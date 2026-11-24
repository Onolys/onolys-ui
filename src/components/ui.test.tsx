import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  Progress,
  Select,
  Separator,
  Skeleton,
  Spinner,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../index";

// Tooltip positioning observes its trigger; jsdom has no ResizeObserver.
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
});
afterAll(() => vi.unstubAllGlobals());

const user = () => userEvent.setup();

describe("Button", () => {
  it("forwards its ref and supports named keyboard activation", async () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    render(
      <Button ref={ref} onClick={onClick}>
        Continue
      </Button>,
    );
    await user().tab();
    await user().keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
    expect(ref.current).toBe(screen.getByRole("button", { name: "Continue" }));
    expect(ref.current).toHaveClass(
      "min-h-11",
      "focus-visible:ring-[3px]",
      "focus-visible:ring-ring",
    );
  });

  it.each([
    "default",
    "destructive",
    "outline",
    "secondary",
    "ghost",
    "link",
  ] as const)("supports the %s variant", (variant) => {
    render(<Button variant={variant}>Action</Button>);
    expect(screen.getByRole("button", { name: "Action" })).toHaveAttribute(
      "data-variant",
      variant,
    );
    expect(screen.getByRole("button")).toHaveClass("focus-visible:ring-ring");
    expect(screen.getByRole("button")).not.toHaveClass(
      "focus-visible:ring-destructive",
    );
    if (variant === "destructive")
      expect(screen.getByRole("button")).toHaveClass(
        "text-destructive-foreground",
      );
  });

  it.each(["icon", "icon-xs", "icon-sm", "icon-lg"] as const)(
    "gives %s buttons a named 44px square target",
    (size) => {
      render(
        <Button size={size} aria-label="Settings">
          +
        </Button>,
      );
      expect(screen.getByRole("button", { name: "Settings" })).toHaveClass(
        "size-11",
      );
    },
  );

  it.each(["default", "xs", "sm", "lg"] as const)(
    "keeps the %s size at least 44px",
    (size) => {
      render(<Button size={size}>Continue</Button>);
      expect(screen.getByRole("button", { name: "Continue" })).toHaveClass(
        "min-h-11",
        "h-11",
      );
    },
  );

  it("preserves disabled and asChild behavior", async () => {
    const click = vi.fn();
    render(
      <>
        <Button disabled onClick={click}>
          Save
        </Button>
        <Button asChild>
          <a href="#report">Report</a>
        </Button>
      </>,
    );
    await user().click(screen.getByRole("button", { name: "Save" }));
    expect(click).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Report" })).toHaveAttribute(
      "href",
      "#report",
    );
  });
});

describe("Input and Label", () => {
  it("associates its label, accepts keyboard input, and forwards its ref", async () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <>
        <Label htmlFor="name">Your name</Label>
        <Input ref={ref} id="name" />
      </>,
    );
    await user().type(
      screen.getByRole("textbox", { name: "Your name" }),
      "Ada",
    );
    expect(ref.current).toHaveValue("Ada");
    expect(ref.current).toHaveClass("min-h-11", "focus-visible:ring-ring");
  });

  it("retains invalid and disabled native input states", () => {
    render(<Input aria-label="Email" aria-invalid disabled type="email" />);
    expect(screen.getByRole("textbox", { name: "Email" })).toBeDisabled();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Textarea", () => {
  it("accepts named multiline keyboard input and a ref", async () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} aria-label="Notes" />);
    await user().type(
      screen.getByRole("textbox", { name: "Notes" }),
      "First{Enter}Second",
    );
    expect(ref.current).toHaveValue("First\nSecond");
    expect(ref.current).toHaveClass("min-h-16", "focus-visible:ring-ring");
  });
});

describe("Checkbox", () => {
  it("toggles a named checkbox with Space and reports its value", async () => {
    const change = vi.fn();
    render(
      <>
        <Checkbox id="terms" onCheckedChange={change} />
        <Label htmlFor="terms">Accept terms</Label>
      </>,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
    await user().tab();
    await user().keyboard(" ");
    expect(checkbox).toBeChecked();
    expect(change).toHaveBeenLastCalledWith(true);
    expect(checkbox).toHaveClass("min-h-11", "min-w-11");
  });

  it("supports indeterminate and disabled states", () => {
    render(
      <Checkbox
        checked="indeterminate"
        disabled
        aria-label="Select sessions"
      />,
    );
    expect(
      screen.getByRole("checkbox", { name: "Select sessions" }),
    ).toBePartiallyChecked();
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });
});

describe("Select", () => {
  it("selects a named native option", async () => {
    const change = vi.fn();
    render(
      <Select
        aria-label="Language"
        onChange={(event) => change(event.currentTarget.value)}
      >
        <option value="en">English</option>
        <option value="fr">French</option>
      </Select>,
    );
    const select = screen.getByRole("combobox", { name: "Language" });
    expect(select).toHaveClass("min-h-11");
    await user().selectOptions(select, "fr");
    expect(change).toHaveBeenCalledWith("fr");
    expect(select).toHaveValue("fr");
  });

  it("preserves disabled semantics", () => {
    render(
      <Select disabled aria-label="Language">
        <option value="en">English</option>
      </Select>,
    );
    expect(screen.getByRole("combobox", { name: "Language" })).toBeDisabled();
  });
});

describe("Tabs", () => {
  it("connects named tabs and panels and switches with arrow keys", async () => {
    render(
      <Tabs defaultValue="report">
        <TabsList aria-label="Session">
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="report">Session report</TabsContent>
        <TabsContent value="notes">Session notes</TabsContent>
      </Tabs>,
    );
    const first = screen.getByRole("tab", { name: "Report" });
    expect(first).toHaveClass("min-h-11");
    expect(screen.getByRole("tabpanel", { name: "Report" })).toHaveTextContent(
      "Session report",
    );
    await user().tab();
    await user().keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Notes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel", { name: "Notes" })).toHaveTextContent(
      "Session notes",
    );
  });
});

describe("Tabs variants", () => {
  it("supports a vertical line list and skips disabled tabs with the keyboard", async () => {
    render(
      <Tabs orientation="vertical" defaultValue="one">
        <TabsList variant="line" aria-label="Sections">
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two" disabled>
            Two
          </TabsTrigger>
          <TabsTrigger value="three">Three</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First section</TabsContent>
        <TabsContent value="three">Third section</TabsContent>
      </Tabs>,
    );
    expect(screen.getByRole("tablist", { name: "Sections" })).toHaveAttribute(
      "data-variant",
      "line",
    );
    await user().tab();
    await user().keyboard("{ArrowDown}");
    expect(screen.getByRole("tabpanel", { name: "Three" })).toHaveTextContent(
      "Third section",
    );
  });
});

describe("Badge links", () => {
  it("keeps a composed link named and keyboard focusable with a 44px target", async () => {
    render(
      <Badge variant="link" asChild>
        <a href="#details">Details</a>
      </Badge>,
    );
    await user().tab();
    expect(screen.getByRole("link", { name: "Details" })).toHaveFocus();
    expect(screen.getByRole("link")).toHaveClass("[a&]:min-h-11");
  });
});

describe("Card", () => {
  it("composes header, description, content and footer and forwards attributes", () => {
    render(
      <Card aria-label="Session summary">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Current session</CardDescription>
        </CardHeader>
        <CardContent>Details</CardContent>
        <CardFooter>Updated today</CardFooter>
      </Card>,
    );
    expect(screen.getByLabelText("Session summary")).toHaveClass(
      "bg-card",
      "text-card-foreground",
    );
    for (const text of [
      "Summary",
      "Current session",
      "Details",
      "Updated today",
    ])
      expect(screen.getByText(text)).toBeVisible();
  });
});

describe("Badge", () => {
  it.each([
    "default",
    "secondary",
    "destructive",
    "outline",
    "ghost",
    "link",
  ] as const)("renders the %s variant", (variant) => {
    render(<Badge variant={variant}>Ready</Badge>);
    expect(screen.getByText("Ready")).toHaveAttribute("data-slot", "badge");
    if (variant === "destructive")
      expect(screen.getByText("Ready")).toHaveClass(
        "text-destructive-foreground",
      );
  });
});

describe("Alert", () => {
  it.each(["default", "destructive"] as const)(
    "announces a named %s alert",
    (variant) => {
      render(
        <Alert variant={variant} aria-labelledby="alert-title">
          <AlertTitle id="alert-title">Upload failed</AlertTitle>
          <AlertDescription>Choose another file.</AlertDescription>
        </Alert>,
      );
      expect(
        screen.getByRole("alert", { name: "Upload failed" }),
      ).toHaveTextContent("Choose another file.");
    },
  );
});

describe("Table", () => {
  it("renders a named semantic table with headers and cells", () => {
    render(
      <Table>
        <TableCaption>Sessions</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const table = screen.getByRole("table", { name: "Sessions" });
    expect(
      within(table).getByRole("columnheader", { name: "Client" }),
    ).toBeVisible();
    expect(within(table).getByRole("cell", { name: "Ada" })).toBeVisible();
  });
});

describe("Dialog", () => {
  it("opens by keyboard with title/description and returns focus on Escape", async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open settings</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Update preferences.</DialogDescription>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Open settings" });
    await user().tab();
    await user().keyboard("{Enter}");
    const dialog = await screen.findByRole("dialog", { name: "Settings" });
    expect(dialog).toHaveAccessibleDescription("Update preferences.");
    expect(within(dialog).getByRole("button", { name: "Close" })).toHaveClass(
      "size-11",
    );
    await user().keyboard("{Shift>}{Tab}{/Shift}");
    expect(within(dialog).getByRole("button", { name: "Close" })).toHaveFocus();
    await user().tab();
    expect(within(dialog).getByRole("button", { name: "Done" })).toHaveFocus();
    await user().keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe("AlertDialog", () => {
  it("focuses cancel on open and activates the confirmation action by keyboard", async () => {
    const confirm = vi.fn();
    render(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>Delete session</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete this session?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the session.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}>
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await user().tab();
    await user().keyboard("{Enter}");
    const dialog = await screen.findByRole("alertdialog", {
      name: "Delete this session?",
    });
    expect(dialog).toHaveAccessibleDescription("This removes the session.");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user().tab();
    await user().keyboard("{Enter}");
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});

describe("DropdownMenu", () => {
  it("opens a named menu by keyboard, skips disabled items, and selects an item", async () => {
    const choose = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Account</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled>Unavailable</DropdownMenuItem>
          <DropdownMenuItem onSelect={choose}>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user().tab();
    await user().keyboard("{Enter}");
    expect(await screen.findByRole("menu", { name: "Account" })).toBeVisible();
    const item = screen.getByRole("menuitem", { name: "Profile" });
    expect(item).toHaveClass("min-h-11");
    expect(item).toHaveFocus();
    await user().keyboard("{Enter}");
    expect(choose).toHaveBeenCalledOnce();
  });
});

describe("DropdownMenu choices", () => {
  it("supports checked, radio and destructive menu items with keyboard operation", async () => {
    const checked = vi.fn();
    const selected = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked onCheckedChange={checked}>
            Show notes
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="recent" onValueChange={selected}>
            <DropdownMenuRadioItem value="recent">Recent</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="all">
              All sessions
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuItem variant="destructive">Remove</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user().tab();
    await user().keyboard("{Enter}");
    expect(
      await screen.findByRole("menuitemcheckbox", { name: "Show notes" }),
    ).toBeChecked();
    expect(screen.getByRole("menuitemradio", { name: "Recent" })).toBeChecked();
    expect(screen.getByRole("menuitem", { name: "Remove" })).toHaveAttribute(
      "data-variant",
      "destructive",
    );
    await user().keyboard("{Enter}");
    expect(checked).toHaveBeenCalledWith(false);
    await user().keyboard("{Enter}");
    await screen.findByRole("menu");
    await user().keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(selected).toHaveBeenCalledWith("all");
  });
});

describe("Separator", () => {
  it("supports semantic vertical and decorative horizontal variants", () => {
    const { rerender } = render(
      <Separator decorative={false} orientation="vertical" />,
    );
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
    rerender(<Separator />);
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });
});

describe("Skeleton", () => {
  it("accepts a loading label without inventing interactive semantics", () => {
    render(
      <Skeleton role="status" aria-label="Loading report" className="h-8" />,
    );
    expect(screen.getByRole("status", { name: "Loading report" })).toHaveClass(
      "animate-pulse",
      "bg-accent",
      "h-8",
    );
  });
});

describe("Spinner", () => {
  it("is decorative, spins only with motion allowed, and keeps a static ring otherwise", () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(<Spinner ref={ref} className="size-6" />);
    const spinner = container.querySelector('[data-slot="spinner"]');
    expect(spinner).toBe(ref.current);
    expect(spinner).toHaveAttribute("aria-hidden", "true");
    expect(spinner).toHaveClass("motion-safe:animate-spin", "size-6");
    expect(spinner).not.toHaveClass("animate-spin");
    expect(spinner).toHaveClass("motion-reduce:border-t-current");
  });
});

describe("Progress", () => {
  it("renders a native progress with value, max and the caller label", () => {
    const ref = createRef<HTMLProgressElement>();
    render(
      <Progress ref={ref} value={40} max={100} aria-label="Overall progress" aria-valuetext="40 percent" />,
    );
    const bar = screen.getByRole("progressbar", { name: "Overall progress" });
    expect(bar.tagName).toBe("PROGRESS");
    expect(bar).toBe(ref.current);
    expect(bar).toHaveAttribute("value", "40");
    expect(bar).toHaveAttribute("max", "100");
    expect(bar).toHaveAttribute("aria-valuetext", "40 percent");
    expect(bar.className).toContain("motion-safe:");
  });

  it("defaults max to 100 and merges className", () => {
    render(<Progress value={10} aria-label="Upload" className="h-4" />);
    const bar = screen.getByRole("progressbar", { name: "Upload" });
    expect(bar).toHaveAttribute("max", "100");
    expect(bar).toHaveClass("h-4");
  });
});

describe("Tooltip", () => {
  it("shows descriptive content on keyboard focus and dismisses with Escape", async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>Help</Button>
          </TooltipTrigger>
          <TooltipContent>How scoring works</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    await user().tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "How scoring works",
    );
    expect(
      screen.getByRole("button", { name: "Help" }),
    ).toHaveAccessibleDescription("How scoring works");
    await user().keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
