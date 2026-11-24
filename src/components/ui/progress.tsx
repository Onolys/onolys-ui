import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

/**
 * Native `<progress>`. Callers provide `aria-label` and, optionally,
 * `aria-valuetext`. The fill animates only when motion is allowed.
 */
function Progress({ className, max = 100, ...props }: ComponentProps<"progress">) {
  return (
    <progress
      data-slot="progress"
      max={max}
      className={cn(
        "block h-3 w-full appearance-none overflow-hidden rounded-full border-0 bg-muted accent-primary",
        "[&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary",
        "motion-safe:[&::-webkit-progress-value]:transition-[width] motion-safe:[&::-webkit-progress-value]:duration-500",
        className,
      )}
      {...props}
    />
  );
}

export { Progress };
