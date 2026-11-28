import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SLOW_START_MS } from "../../constants";
import { SlowStartNotice } from "./slow-start";

const MSG = /starting the server/i;
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

describe("SlowStartNotice", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows nothing before the threshold", () => {
    render(<SlowStartNotice pending />);
    advance(SLOW_START_MS - 1);
    expect(screen.queryByText(MSG)).toBeNull();
  });

  it("shows the message once still pending after the threshold", () => {
    render(<SlowStartNotice pending />);
    advance(SLOW_START_MS);
    expect(screen.getByRole("status")).toHaveTextContent(MSG);
  });

  it("hides when the request succeeds", () => {
    const { rerender } = render(<SlowStartNotice pending />);
    advance(SLOW_START_MS);
    rerender(<SlowStartNotice pending={false} />);
    expect(screen.queryByText(MSG)).toBeNull();
  });

  it("never shows when the request fails before the threshold (pending ends)", () => {
    const { rerender } = render(<SlowStartNotice pending />);
    advance(SLOW_START_MS - 100);
    rerender(<SlowStartNotice pending={false} />);
    advance(SLOW_START_MS);
    expect(screen.queryByText(MSG)).toBeNull();
  });
});
