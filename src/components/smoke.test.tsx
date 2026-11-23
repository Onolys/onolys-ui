import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Smoke } from "./smoke";

describe("package scaffold", () => {
  it("renders caller content and forwards a React 19 ref as a prop", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Smoke ref={ref}>Package ready</Smoke>);

    expect(screen.getByText("Package ready")).toHaveAttribute("data-slot", "smoke");
    expect(ref.current).toBe(screen.getByText("Package ready"));
  });
});
