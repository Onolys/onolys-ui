import { useEffect, useRef, useState, type ReactElement } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export type AccountMenuLink = { href: string; label: string };

/** Default link renderer: a plain anchor. Apps inject their router link through `renderLink`. */
const plainLink = (link: AccountMenuLink) => <a href={link.href}>{link.label}</a>;

/**
 * Avatar button at the far right of the header; opens the email, caller-supplied links and Sign out
 * (shared nonmodal DropdownMenu). Router-agnostic: `renderLink` returns the element that wraps each link.
 */
export function AccountMenu({ email, links = [], renderLink = plainLink, onSignOut }: {
  email: string | null;
  links?: AccountMenuLink[];
  renderLink?: (link: AccountMenuLink) => ReactElement;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  // Set when a link is chosen: the route change focuses the page heading, so the menu must not refocus its trigger.
  const navigating = useRef(false);
  // Menu pattern: opening (pointer or keyboard) moves focus to the first item. Radix focuses the content on pointer open.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const el = contentRef.current;
      if (el && (document.activeElement === el || document.activeElement === document.body)) el.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const initial = (email?.trim()[0] ?? "?").toUpperCase();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Button asChild size="icon" className="rounded-full font-semibold">
        <DropdownMenuTrigger aria-label="Account menu">{initial}</DropdownMenuTrigger>
      </Button>
      <DropdownMenuContent
        ref={contentRef}
        align="end"
        loop
        onCloseAutoFocus={(e) => {
          if (navigating.current) {
            e.preventDefault();
            navigating.current = false;
          }
        }}
        // Tab leaves the menu: close it (Radix keeps focus on the trigger rather than tabbing on).
        onKeyDown={(e) => {
          if (e.key === "Tab") setOpen(false);
        }}
        className="min-w-56 max-w-80"
      >
        {email && <DropdownMenuLabel className="font-normal break-words text-muted-foreground">{email}</DropdownMenuLabel>}
        {email && <DropdownMenuSeparator />}
        {links.map((link) => (
          <DropdownMenuItem
            key={link.href}
            asChild
            onSelect={() => {
              navigating.current = true;
            }}
          >
            {renderLink(link)}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onSelect={onSignOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
