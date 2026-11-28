import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AccountMenu } from "./account-menu";

const links = [{ href: "/settings", label: "Settings" }];

describe("AccountMenu", () => {
  it("shows the initial, the email, caller links and Sign out", async () => {
    render(<AccountMenu email="ada@example.org" links={links} onSignOut={() => {}} />);
    const trigger = screen.getByRole("button", { name: "Account menu" });
    expect(trigger).toHaveTextContent("A");
    await userEvent.click(trigger);
    expect(screen.getByText("ada@example.org")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument();
  });

  it("renders links through the injected renderLink (router-agnostic)", async () => {
    render(
      <AccountMenu
        email={null}
        links={links}
        renderLink={(link) => <a href={link.href} data-router-link="true">{link.label}</a>}
        onSignOut={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute("data-router-link", "true");
    expect(screen.getByRole("button", { name: "Account menu" })).toHaveTextContent("?");
  });

  it("works with no links and calls onSignOut", async () => {
    const onSignOut = vi.fn();
    render(<AccountMenu email="x@y.z" onSignOut={onSignOut} />);
    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getAllByRole("menuitem")).toHaveLength(1);
    await userEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("moves focus to the first item when opened by keyboard", async () => {
    render(<AccountMenu email="x@y.z" links={links} onSignOut={() => {}} />);
    screen.getByRole("button", { name: "Account menu" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("menuitem", { name: "Settings" })).toHaveFocus();
  });
});
