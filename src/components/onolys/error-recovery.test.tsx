import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorRecovery } from "./error-recovery";

describe("ErrorRecovery", () => {
  it("offers reload and back, showing only a safe status and reference", () => {
    const reload = vi.fn();
    render(<ErrorRecovery status={503} reference="req-123.example" reload={reload} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.getByText("Error 503")).toBeInTheDocument();
    expect(screen.getByText("Reference: req-123.example")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reload page" }));
    expect(reload).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Back to the start" })).toHaveAttribute("href", "/");
  });

  it("never displays untrusted reference text", () => {
    render(<ErrorRecovery status={500} reference="patient@example.org" />);
    expect(screen.queryByText(/patient@example/)).toBeNull();
  });

  it("uses not-found copy for 404 and focuses the heading", () => {
    render(<ErrorRecovery status={404} homeHref="/home" />);
    const heading = screen.getByRole("heading", { name: "Page not found" });
    expect(heading).toHaveFocus();
    expect(screen.getByRole("link", { name: "Back to the start" })).toHaveAttribute("href", "/home");
  });

  it("omits status and reference when absent", () => {
    render(<ErrorRecovery />);
    expect(screen.queryByText(/^Error /)).toBeNull();
    expect(screen.queryByText(/Reference:/)).toBeNull();
  });
});
