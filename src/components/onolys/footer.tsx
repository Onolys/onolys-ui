import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type FooterProps = ComponentProps<"footer"> & {
  notices?: ReactNode;
  links?: ReactNode;
  linksLabel?: string;
  copyright?: ReactNode;
};

/** Policy copy, router links, contact details, and copyright belong to the application. */
export function Footer({
  notices, links, linksLabel = "Footer", copyright, children, className, ...props
}: FooterProps) {
  return (
    <footer
      data-slot="footer"
      className={cn("space-y-4 bg-footer-bg px-gutter py-8 text-footer-text [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:text-footer-link [&_a:focus-visible]:outline-footer-link", className)}
      {...props}
    >
      {notices}
      {links != null && links !== false && (
        <nav aria-label={linksLabel} className="flex flex-wrap gap-x-4 gap-y-2">{links}</nav>
      )}
      {children}
      {copyright != null && <div className="text-sm text-footer-muted">{copyright}</div>}
    </footer>
  );
}
