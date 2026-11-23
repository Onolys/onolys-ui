import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../index";

function Contents() {
  return (
    <DialogContent>
      <DialogTitle>Preferences</DialogTitle>
      <DialogDescription>Adjust settings.</DialogDescription>
      <DialogClose>Done</DialogClose>
    </DialogContent>
  );
}

function expectNoInjectedStyle() {
  expect(document.querySelectorAll("style")).toHaveLength(0);
}

describe("CSP-safe modal dialogs", () => {
  it("opens without an injected stylesheet, locks scroll, traps focus, and closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open preferences</DialogTrigger>
        <Contents />
      </Dialog>,
    );
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "Preferences" })).toBeVisible();
    expectNoInjectedStyle();
    expect(document.body).toHaveAttribute("data-scroll-locked", "1");
    expect(screen.getByRole("button", { name: "Done" })).toHaveFocus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
    expect(
      screen.getByRole("button", { name: "Open preferences" }),
    ).toHaveFocus();
  });

  it("retains controlled-state ownership and notifies requests without unlocking early", async () => {
    const change = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <Dialog open onOpenChange={change}>
        <Contents />
      </Dialog>,
    );
    expectNoInjectedStyle();
    await user.keyboard("{Escape}");
    expect(change).toHaveBeenCalledWith(false);
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(document.body).toHaveAttribute("data-scroll-locked", "1");
    rerender(
      <Dialog open={false} onOpenChange={change}>
        <Contents />
      </Dialog>,
    );
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
  });

  it("counts nested Dialog and AlertDialog locks and restores an existing lock", async () => {
    document.body.setAttribute("data-scroll-locked", "external");
    try {
      const user = userEvent.setup();
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Parent</DialogTitle>
            <DialogDescription>Parent description.</DialogDescription>
            <AlertDialog>
              <AlertDialogTrigger>Open child</AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Confirm</AlertDialogTitle>
                <AlertDialogDescription>Confirm action.</AlertDialogDescription>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogContent>
            </AlertDialog>
            <DialogClose>Done</DialogClose>
          </DialogContent>
        </Dialog>,
      );
      expect(document.body).toHaveAttribute("data-scroll-locked", "1");
      await user.click(screen.getByRole("button", { name: "Open child" }));
      expect(document.body).toHaveAttribute("data-scroll-locked", "2");
      expectNoInjectedStyle();
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(document.body).toHaveAttribute("data-scroll-locked", "1");
      expect(screen.getByRole("button", { name: "Open child" })).toHaveFocus();
      await user.keyboard("{Escape}");
      expect(document.body).toHaveAttribute("data-scroll-locked", "external");
    } finally {
      document.body.removeAttribute("data-scroll-locked");
    }
  });

  it("balances locks when mounted in StrictMode and when unmounted while open", () => {
    const { unmount } = render(
      <StrictMode>
        <Dialog defaultOpen>
          <Contents />
        </Dialog>
      </StrictMode>,
    );
    expect(document.body).toHaveAttribute("data-scroll-locked", "1");
    expectNoInjectedStyle();
    unmount();
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
  });

  it("leaves non-modal dialogs unlocked", () => {
    render(
      <Dialog defaultOpen modal={false}>
        <Contents />
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
    expect(
      document.querySelector('[data-slot="dialog-overlay"]'),
    ).not.toBeInTheDocument();
    expectNoInjectedStyle();
  });

  it("uses a clickable CSP-safe backdrop and preserves outside-event cancellation", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const outside = vi.fn((event: Event) => event.preventDefault());
    const { rerender } = render(
      <Dialog defaultOpen>
        <DialogContent onPointerDownOutside={outside}>
          <DialogTitle>Preferences</DialogTitle>
          <DialogDescription>Adjust settings.</DialogDescription>
          <Button>Done</Button>
        </DialogContent>
      </Dialog>,
    );
    const backdrop = document.querySelector('[data-slot="dialog-overlay"]')!;
    expect(backdrop).toHaveClass("pointer-events-auto");
    await user.click(backdrop);
    expect(screen.getByRole("dialog")).toBeVisible();
    await waitFor(() => expect(outside).toHaveBeenCalled());
    rerender(
      <Dialog defaultOpen>
        <Contents />
      </Dialog>,
    );
    await user.click(document.querySelector('[data-slot="dialog-overlay"]')!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("CSP-safe alert and menu behavior", () => {
  it("keeps alert cancel focus, ignores backdrop clicks, and releases its lock on cancel", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm</AlertDialogTitle>
          <AlertDialogDescription>Confirm action.</AlertDialogDescription>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    expectNoInjectedStyle();
    await user.click(
      document.querySelector('[data-slot="alert-dialog-overlay"]')!,
    );
    expect(screen.getByRole("alertdialog")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
  });

  it("opens menus without injecting styles or locking document scroll", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Account</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menu", { name: "Account" })).toBeVisible();
    expectNoInjectedStyle();
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Account" })).toHaveFocus();
  });
});
