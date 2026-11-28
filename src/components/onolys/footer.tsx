import type { ComponentProps, ReactNode } from "react";
import { FOOTER_COMPACT } from "../../constants";
import { cn } from "../../lib/cn";

export type FooterProps = ComponentProps<"footer"> & {
  notices?: ReactNode;
  links?: ReactNode;
  linksLabel?: string;
  copyright?: ReactNode;
  /** One-row, small-type layout for slim app footers. */
  compact?: boolean;
  /** Rendered in the bottom-right corner (e.g. a ThemeToggle). */
  themeToggle?: ReactNode;
};

/** Policy copy, router links, contact details, and copyright belong to the application. */
export function Footer({
  notices, links, linksLabel = "Footer", copyright, compact = false, themeToggle, children, className, ...props
}: FooterProps) {
  return (
    <footer
      data-slot="footer"
      className={cn("space-y-4 bg-footer-bg px-gutter py-8 text-footer-text [&_a]:inline-flex [&_a]:min-h-11 [&_a]:min-w-11 [&_a]:items-center [&_a]:text-footer-link [&_a:focus-visible]:outline-footer-link", compact && FOOTER_COMPACT, className)}
      {...props}
    >
      {notices}
      {links != null && links !== false && (
        <nav aria-label={linksLabel} className="flex flex-wrap gap-x-4 gap-y-2">{links}</nav>
      )}
      {children}
      {copyright != null && <div className="text-sm text-footer-muted">{copyright}</div>}
      {themeToggle != null && themeToggle !== false && (
        <div data-slot="footer-theme-toggle" className="absolute right-3 bottom-2">{themeToggle}</div>
      )}
    </footer>
  );
}
