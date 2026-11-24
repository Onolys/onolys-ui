import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

/**
 * Decorative busy indicator. Always pair it with visible text that carries the
 * meaning. Spins only when motion is allowed; otherwise a static full ring.
 */
function Spinner({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="spinner"
      aria-hidden="true"
      className={cn(
        "inline-block size-4 shrink-0 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin motion-reduce:border-t-current",
        className,
      )}
      {...props}
    />
  );
}

export { Spinner };
