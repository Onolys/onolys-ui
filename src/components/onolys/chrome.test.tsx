import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "./app-header";
import { Footer } from "./footer";
import { ScoreBadge } from "./score-badge";
import { UsageMeter } from "./usage-meter";
import { SkipLink } from "./skip-link";
import { Page, Section } from "./page";

function RouterLink({ to, children }: { to: string; children: ReactNode }) {
  return <a href={to} data-router-link="true">{children}</a>;
}

describe("AppHeader", () => {
  it("accepts caller-owned brand, router navigation, and account-menu nodes", () => {
    render(<AppHeader
      brand={<RouterLink to="/">Example</RouterLink>}
      navigation={<RouterLink to="/sessions">Sessions</RouterLink>}
      accountMenu={<button type="button">My account</button>}
    />);
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("link", { name: "Example" })).toHaveAttribute("href", "/");
    const navigation = within(header).getByRole("navigation", { name: "Main" });
    expect(within(navigation).getByRole("link", { name: "Sessions" })).toHaveAttribute("data-router-link", "true");
    expect(within(header).getByRole("button", { name: "My account" })).toBeVisible();
    expect(within(header).getAllByRole("link")).toHaveLength(2);
  });

  it("omits navigation and account slots in a brand-only header", () => {
    render(<AppHeader brand="Example" />);
    expect(screen.getByRole("banner")).toHaveTextContent("Example");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

it("renders Footer content and caller-owned links in semantic landmarks", () => {
  render(<Footer
    notices={<p>Service notice</p>}
    links={<RouterLink to="/privacy">Privacy</RouterLink>}
    copyright="© 2026 Example"
  ><p>Contact the team</p></Footer>);
  const footer = screen.getByRole("contentinfo");
  expect(footer).toHaveTextContent("Service notice");
  expect(footer).toHaveTextContent("Contact the team");
  expect(footer).toHaveTextContent("© 2026 Example");
  const navigation = within(footer).getByRole("navigation", { name: "Footer" });
  expect(within(navigation).getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
});

it("renders Page and a named Section as main and region landmarks", () => {
  render(<Page><Section aria-labelledby="details"><h2 id="details">Details</h2></Section></Page>);
  expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  expect(screen.getByRole("region", { name: "Details" })).toContainElement(screen.getByRole("heading", { name: "Details" }));
});

describe("ScoreBadge", () => {
  it.each([
    ["good", "Good"], ["fair", "Fair"], ["low", "Low"],
  ] as const)("labels %s scores with visible text", (variant, text) => {
    render(<ScoreBadge variant={variant}>3.2</ScoreBadge>);
    expect(screen.getByText(text)).toBeVisible();
    expect(screen.getByText("3.2")).toBeVisible();
  });
});

describe("UsageMeter", () => {
  it("labels a native meter and describes remaining daily allowance", () => {
    render(<UsageMeter label="Daily sessions" used={2} cap={5} periodLabel="today" />);
    const meter = screen.getByRole("meter", { name: "Daily sessions" });
    expect(meter).toHaveAttribute("value", "3");
    expect(meter).toHaveAttribute("min", "0");
    expect(meter).toHaveAttribute("max", "5");
    expect(meter).toHaveAttribute("aria-valuetext", "3 of 5 left today");
    expect(meter).toHaveAccessibleDescription("3 of 5 left today");
    expect(screen.getByText("3 of 5 left today")).toBeVisible();
  });

  it.each([
    { used: -3, cap: 5, remaining: 5, maximum: 5, text: "5 of 5 left" },
    { used: 0.2, cap: 0.5, remaining: 0.3, maximum: 0.5, text: "0.3 of 0.5 left" },
    { used: 9, cap: 5, remaining: 0, maximum: 5, text: "0 of 5 left" },
    { used: NaN, cap: 5, remaining: 5, maximum: 5, text: "5 of 5 left" },
    { used: Infinity, cap: 5, remaining: 0, maximum: 5, text: "0 of 5 left" },
    { used: -Infinity, cap: 5, remaining: 5, maximum: 5, text: "5 of 5 left" },
    { used: 2, cap: 0, remaining: 0, maximum: 1, text: "0 of 0 left" },
    { used: 2, cap: -1, remaining: 0, maximum: 1, text: "0 of 0 left" },
    { used: 2, cap: NaN, remaining: 0, maximum: 1, text: "0 of 0 left" },
    { used: 2, cap: Infinity, remaining: 0, maximum: 1, text: "0 of 0 left" },
  ])("bounds degenerate input: $used used, $cap cap", ({ used, cap, remaining, maximum, text }) => {
    render(<UsageMeter label="Usage" used={used} cap={cap} />);
    const meter = screen.getByRole("meter", { name: "Usage" }) as HTMLMeterElement;
    expect(meter.value).toBe(remaining);
    expect(meter.min).toBe(0);
    expect(meter.max).toBe(maximum);
    expect(meter).toHaveAttribute("aria-valuetext", text);
    expect(screen.getByText(text)).toBeVisible();
  });
});

describe("SkipLink", () => {
  it("keeps a fragment href and focuses the main target when activated", () => {
    render(<><SkipLink /><Page>Content</Page></>);
    const link = screen.getByRole("link", { name: "Skip to main content" });
    expect(link).toHaveAttribute("href", "#main");
    fireEvent.click(link);
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("makes a custom target programmatically focusable", () => {
    render(<><SkipLink targetId="content heading">Skip to heading</SkipLink><h1 id="content heading">Title</h1></>);
    const link = screen.getByRole("link", { name: "Skip to heading" });
    expect(link).toHaveAttribute("href", "#content%20heading");
    fireEvent.click(link);
    expect(screen.getByRole("heading", { name: "Title" })).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Title" })).toHaveAttribute("tabindex", "-1");
  });

  it("preserves a target's native keyboard focusability", () => {
    render(<><SkipLink targetId="action" /><button id="action" type="button">Action</button></>);
    fireEvent.click(screen.getByRole("link", { name: "Skip to main content" }));
    const target = screen.getByRole("button", { name: "Action" });
    expect(target).toHaveFocus();
    expect(target).not.toHaveAttribute("tabindex");
  });

  it("honors a caller-prevented click", () => {
    const handler = vi.fn((event) => event.preventDefault());
    render(<><SkipLink onClick={handler} /><Page>Content</Page></>);
    const link = screen.getByRole("link", { name: "Skip to main content" });
    link.focus();
    fireEvent.click(link);
    expect(handler).toHaveBeenCalledOnce();
    expect(link).toHaveFocus();
  });
});
