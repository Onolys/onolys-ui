import { useId, type ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type UsageMeterProps = Omit<ComponentProps<"div">, "children"> & {
  label: string;
  used: number;
  cap: number;
  periodLabel?: string;
};

/** Remaining allowance, with finite bounds and a readable zero-cap state. */
export function UsageMeter({
  label, used, cap, periodLabel, className, ...props
}: UsageMeterProps) {
  const id = useId();
  const limit = Number.isFinite(cap) ? Math.max(0, cap) : 0;
  const consumed = Number.isNaN(used) ? 0 : Math.max(0, Math.min(used, limit));
  const remaining = limit - consumed;
  const summary = `${remaining} of ${limit} left${periodLabel ? ` ${periodLabel}` : ""}`;

  return (
    <div data-slot="usage-meter" className={cn("space-y-2 text-sm text-foreground", className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span id={`${id}-label`}>{label.trim() || "Usage"}</span>
        <span id={`${id}-summary`} className="text-muted-foreground">{summary}</span>
      </div>
      <meter
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-summary`}
        aria-valuetext={summary}
        min={0}
        // A native meter requires max > min, even when there is no allowance.
        max={limit > 0 ? limit : 1}
        value={remaining}
        className="block h-3 w-full accent-primary [&::-webkit-meter-bar]:rounded-full [&::-webkit-meter-bar]:border-0 [&::-webkit-meter-bar]:bg-muted [&::-webkit-meter-optimum-value]:bg-primary [&::-moz-meter-bar]:bg-primary"
      />
    </div>
  );
}
