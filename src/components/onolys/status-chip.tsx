import { Badge } from "../ui/badge";
import type { ComponentProps } from "react";

/** Status colour only; the chip's own text always says what it means. Reused by the session list and the report. */
export type ChipTone = "progress" | "wait" | "done" | "failed" | "agree" | "differs" | "flagged" | "neutral" | "muted";

const GOOD = "border-score-good bg-score-good-bg text-score-good";
const FAIR = "border-score-fair bg-score-fair-bg text-score-fair";
const LOW = "border-score-low bg-score-low-bg text-score-low";

const TONE: Record<ChipTone, string> = {
  progress: "border-primary text-primary",
  wait: FAIR,
  done: GOOD,
  failed: LOW,
  agree: GOOD,
  differs: LOW,
  flagged: FAIR,
  neutral: "",
  muted: "text-muted-foreground",
};

/** Badge (which has no tone variants) plus a `data-tone` hook and token classes. Pass the visible text as children. */
export function StatusChip({ tone = "neutral", className, ...props }: { tone?: ChipTone } & Omit<ComponentProps<typeof Badge>, "variant">) {
  return <Badge variant="outline" data-tone={tone} className={[TONE[tone], className].filter(Boolean).join(" ")} {...props} />;
}
