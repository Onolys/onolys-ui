import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

/** Main content is focusable by SkipLink without entering the normal tab order. */
export function Page({ id = "main", tabIndex = -1, className, ...props }: ComponentProps<"main">) {
  return <main data-slot="page" id={id} tabIndex={tabIndex} className={cn("mx-auto w-full max-w-7xl px-gutter py-8 text-foreground", className)} {...props} />;
}

/** Supply aria-label or aria-labelledby when the section should be a named region. */
export function Section({ className, ...props }: ComponentProps<"section">) {
  return <section data-slot="section" className={cn("space-y-6", className)} {...props} />;
}
