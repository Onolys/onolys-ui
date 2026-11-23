import type { ComponentProps, MouseEvent } from "react";
import { cn } from "../../lib/cn";

export type SkipLinkProps = Omit<ComponentProps<"a">, "href"> & {
  targetId?: string;
};

export function SkipLink({
  targetId = "main", children = "Skip to main content", onClick, className, ...props
}: SkipLinkProps) {
  function focusTarget(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const target = document.getElementById(targetId);
    if (target) {
      if (!target.hasAttribute("tabindex") && target.tabIndex < 0) target.setAttribute("tabindex", "-1");
      target.focus();
    }
  }

  return (
    <a
      data-slot="skip-link"
      href={`#${encodeURIComponent(targetId)}`}
      onClick={focusTarget}
      className={cn("sr-only min-h-11 items-center rounded-md bg-background px-4 py-2 text-primary focus:not-sr-only focus:absolute focus:top-4 focus:left-gutter focus:z-50 focus:inline-flex", className)}
      {...props}
    >
      {children}
    </a>
  );
}
