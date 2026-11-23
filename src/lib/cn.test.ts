import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("combines conditional classes and resolves Tailwind conflicts", () => {
    expect(cn("px-2 text-sm", false, ["px-4"], { block: true }))
      .toBe("text-sm px-4 block");
    expect(cn("bg-primary", "bg-destructive")).toBe("bg-destructive");
    expect(cn(undefined, null, false)).toBe("");
  });
});
