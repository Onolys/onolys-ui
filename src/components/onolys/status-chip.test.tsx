import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusChip, type ChipTone } from "./status-chip";

describe("StatusChip", () => {
  it.each<ChipTone>(["progress", "wait", "done", "failed", "agree", "differs", "flagged", "neutral", "muted"])("keeps its own text and data-tone for %s", (tone) => {
    render(<StatusChip tone={tone}>Custom text</StatusChip>);
    const chip = screen.getByText("Custom text");
    expect(chip).toHaveAttribute("data-tone", tone);
    expect(chip).toHaveAttribute("data-slot", "badge");
  });

  it("muted greys the text; neutral stays unstyled", () => {
    render(<><StatusChip tone="muted">Quiet</StatusChip><StatusChip tone="neutral">Plain</StatusChip></>);
    expect(screen.getByText("Quiet").className).toMatch(/text-muted-foreground/);
    expect(screen.getByText("Plain").className).not.toMatch(/text-muted-foreground/);
  });

  it("adds tone colours from semantic tokens only", () => {
    render(<StatusChip tone="failed">Failed</StatusChip>);
    expect(screen.getByText("Failed").className).toMatch(/text-score-low/);
    expect(screen.getByText("Failed").className).not.toMatch(/gray-/);
  });
});
