import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

const scoreStyles = {
  good: "bg-score-good-bg text-score-good",
  fair: "bg-score-fair-bg text-score-fair",
  low: "bg-score-low-bg text-score-low",
} as const;

const scoreLabels = { good: "Good", fair: "Fair", low: "Low" } as const;

export type ScoreBadgeProps = ComponentProps<"span"> & {
  variant: keyof typeof scoreStyles;
};

/** A score's meaning stays visible in text as well as color. */
export function ScoreBadge({ variant, children, className, ...props }: ScoreBadgeProps) {
  return (
    <span
      data-slot="score-badge"
      data-variant={variant}
      className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium", scoreStyles[variant], className)}
      {...props}
    >
      <span>{scoreLabels[variant]}</span>
      {children != null && <span>{children}</span>}
    </span>
  );
}
