import { ClassValue } from 'clsx';
import * as React$1 from 'react';
import { ComponentProps, ReactNode, ReactElement } from 'react';
import { AlertDialog as AlertDialog$1, Checkbox as Checkbox$1, Dialog as Dialog$1, DropdownMenu as DropdownMenu$1, Label as Label$1, Separator as Separator$1, Tabs as Tabs$1, Tooltip as Tooltip$1 } from 'radix-ui';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';
export { a as ACTIONS, A as AUTH_PATHS, H as H1, b as HEADER_CENTER_NAV, L as LINK, c as LINK_BTN, N as NAV_LINK, d as NOTE, P as PAGE, S as SLOW_START_MS, T as THEME_STORAGE_KEY } from './constants-BvBCQRbA.js';

declare function cn(...inputs: ClassValue[]): string;

declare const buttonVariants: (props?: ({
    variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | null | undefined;
    size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Button({ className, variant, size, asChild, ...props }: React$1.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
}): React$1.JSX.Element;

declare function AlertDialog({ open, defaultOpen, onOpenChange, ...props }: React$1.ComponentProps<typeof AlertDialog$1.Root>): React$1.JSX.Element;
declare function AlertDialogTrigger({ className, ...props }: React$1.ComponentProps<typeof AlertDialog$1.Trigger>): React$1.JSX.Element;
declare function AlertDialogPortal({ ...props }: React$1.ComponentProps<typeof AlertDialog$1.Portal>): React$1.JSX.Element;
declare function AlertDialogOverlay(props: React$1.ComponentProps<typeof AlertDialog$1.Overlay>): React$1.JSX.Element;
declare function AlertDialogContent({ className, size, ...props }: React$1.ComponentProps<typeof AlertDialog$1.Content> & {
    size?: "default" | "sm";
}): React$1.JSX.Element;
declare function AlertDialogHeader({ className, ...props }: React$1.ComponentProps<"div">): React$1.JSX.Element;
declare function AlertDialogFooter({ className, ...props }: React$1.ComponentProps<"div">): React$1.JSX.Element;
declare function AlertDialogTitle({ className, ...props }: React$1.ComponentProps<typeof AlertDialog$1.Title>): React$1.JSX.Element;
declare function AlertDialogDescription({ className, ...props }: React$1.ComponentProps<typeof AlertDialog$1.Description>): React$1.JSX.Element;
declare function AlertDialogMedia({ className, ...props }: React$1.ComponentProps<"div">): React$1.JSX.Element;
declare function AlertDialogAction({ className, variant, size, ...props }: React$1.ComponentProps<typeof AlertDialog$1.Action> & Pick<React$1.ComponentProps<typeof Button>, "variant" | "size">): React$1.JSX.Element;
declare function AlertDialogCancel({ className, variant, size, ...props }: React$1.ComponentProps<typeof AlertDialog$1.Cancel> & Pick<React$1.ComponentProps<typeof Button>, "variant" | "size">): React$1.JSX.Element;

declare const alertVariants: (props?: ({
    variant?: "default" | "destructive" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Alert({ className, variant, ...props }: React$1.ComponentProps<"div"> & VariantProps<typeof alertVariants>): React$1.JSX.Element;
declare function AlertTitle({ className, ...props }: React$1.ComponentProps<"div">): React$1.JSX.Element;
declare function AlertDescription({ className, ...props }: React$1.ComponentProps<"div">): React$1.JSX.Element;

declare const badgeVariants: (props?: ({
    variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Badge({ className, variant, asChild, ...props }: React$1.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
}): React$1.JSX.Element;

declare function Card({ className, ...props }: React$1.ComponentProps<"div">): React$1.JSX.Element;
declare function CardHeader({ className, ...props }: React$1.ComponentProps<"div">): React$1.JSX.Element;
declare function CardTitle({ className, ...props }: React$1.ComponentProps<"div">): React$1.JSX.Element;
declare function CardDescription({ className, ...props }: React$1.ComponentProps<"div">): React$1.JSX.Element;
declare function CardAction({ className, ...props }: React$1.ComponentProps<"div">): React$1.JSX.Element;
declare function CardContent({ className, ...props }: React$1.ComponentProps<"div">): React$1.JSX.Element;
declare function CardFooter({ className, ...props }: React$1.ComponentProps<"div">): React$1.JSX.Element;

declare function Checkbox({ className, ...props }: React$1.ComponentProps<typeof Checkbox$1.Root>): React$1.JSX.Element;

declare function Dialog({ open, defaultOpen, onOpenChange, modal, ...props }: React$1.ComponentProps<typeof Dialog$1.Root>): React$1.JSX.Element;
declare function DialogTrigger({ className, ...props }: React$1.ComponentProps<typeof Dialog$1.Trigger>): React$1.JSX.Element;
declare function DialogPortal({ ...props }: React$1.ComponentProps<typeof Dialog$1.Portal>): React$1.JSX.Element;
declare function DialogClose({ className, ...props }: React$1.ComponentProps<typeof Dialog$1.Close>): React$1.JSX.Element;
declare function DialogOverlay(props: React$1.ComponentProps<typeof Dialog$1.Overlay>): React$1.JSX.Element;
declare function DialogContent({ className, children, showCloseButton, ...props }: React$1.ComponentProps<typeof Dialog$1.Content> & {
    showCloseButton?: boolean;
}): React$1.JSX.Element;
declare function DialogHeader({ className, ...props }: React$1.ComponentProps<"div">): React$1.JSX.Element;
declare function DialogFooter({ className, showCloseButton, children, ...props }: React$1.ComponentProps<"div"> & {
    showCloseButton?: boolean;
}): React$1.JSX.Element;
declare function DialogTitle({ className, ...props }: React$1.ComponentProps<typeof Dialog$1.Title>): React$1.JSX.Element;
declare function DialogDescription({ className, ...props }: React$1.ComponentProps<typeof Dialog$1.Description>): React$1.JSX.Element;

declare function DropdownMenu({ ...props }: Omit<React$1.ComponentProps<typeof DropdownMenu$1.Root>, "modal">): React$1.JSX.Element;
declare function DropdownMenuPortal({ ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Portal>): React$1.JSX.Element;
declare function DropdownMenuTrigger({ className, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Trigger>): React$1.JSX.Element;
declare function DropdownMenuContent({ className, sideOffset, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Content>): React$1.JSX.Element;
declare function DropdownMenuGroup({ ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Group>): React$1.JSX.Element;
declare function DropdownMenuItem({ className, inset, variant, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
}): React$1.JSX.Element;
declare function DropdownMenuCheckboxItem({ className, children, checked, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.CheckboxItem>): React$1.JSX.Element;
declare function DropdownMenuRadioGroup({ ...props }: React$1.ComponentProps<typeof DropdownMenu$1.RadioGroup>): React$1.JSX.Element;
declare function DropdownMenuRadioItem({ className, children, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.RadioItem>): React$1.JSX.Element;
declare function DropdownMenuLabel({ className, inset, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Label> & {
    inset?: boolean;
}): React$1.JSX.Element;
declare function DropdownMenuSeparator({ className, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Separator>): React$1.JSX.Element;
declare function DropdownMenuShortcut({ className, ...props }: React$1.ComponentProps<"span">): React$1.JSX.Element;
declare function DropdownMenuSub({ ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Sub>): React$1.JSX.Element;
declare function DropdownMenuSubTrigger({ className, inset, children, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.SubTrigger> & {
    inset?: boolean;
}): React$1.JSX.Element;
declare function DropdownMenuSubContent({ className, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.SubContent>): React$1.JSX.Element;

declare function Input({ className, type, ...props }: React$1.ComponentProps<"input">): React$1.JSX.Element;

declare function Label({ className, ...props }: React$1.ComponentProps<typeof Label$1.Root>): React$1.JSX.Element;

/**
 * Native `<progress>`. Callers provide `aria-label` and, optionally,
 * `aria-valuetext`. The fill animates only when motion is allowed.
 */
declare function Progress({ className, max, ...props }: ComponentProps<"progress">): React$1.JSX.Element;

/** Native options keep browser keyboard/form behavior without runtime stylesheets. */
declare function Select({ className, ...props }: React$1.ComponentProps<"select">): React$1.JSX.Element;

declare function Separator({ className, orientation, decorative, ...props }: React$1.ComponentProps<typeof Separator$1.Root>): React$1.JSX.Element;

declare function Skeleton({ className, ...props }: React.ComponentProps<"div">): React$1.JSX.Element;

/**
 * Decorative busy indicator. Always pair it with visible text that carries the
 * meaning. Spins only when motion is allowed; otherwise a static full ring.
 */
declare function Spinner({ className, ...props }: ComponentProps<"span">): React$1.JSX.Element;

declare function Table({ className, ...props }: React$1.ComponentProps<"table">): React$1.JSX.Element;
declare function TableHeader({ className, ...props }: React$1.ComponentProps<"thead">): React$1.JSX.Element;
declare function TableBody({ className, ...props }: React$1.ComponentProps<"tbody">): React$1.JSX.Element;
declare function TableFooter({ className, ...props }: React$1.ComponentProps<"tfoot">): React$1.JSX.Element;
declare function TableRow({ className, ...props }: React$1.ComponentProps<"tr">): React$1.JSX.Element;
declare function TableHead({ className, ...props }: React$1.ComponentProps<"th">): React$1.JSX.Element;
declare function TableCell({ className, ...props }: React$1.ComponentProps<"td">): React$1.JSX.Element;
declare function TableCaption({ className, ...props }: React$1.ComponentProps<"caption">): React$1.JSX.Element;

declare function Tabs({ className, orientation, ...props }: React$1.ComponentProps<typeof Tabs$1.Root>): React$1.JSX.Element;
declare const tabsListVariants: (props?: ({
    variant?: "default" | "line" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function TabsList({ className, variant, ...props }: React$1.ComponentProps<typeof Tabs$1.List> & VariantProps<typeof tabsListVariants>): React$1.JSX.Element;
declare function TabsTrigger({ className, ...props }: React$1.ComponentProps<typeof Tabs$1.Trigger>): React$1.JSX.Element;
declare function TabsContent({ className, ...props }: React$1.ComponentProps<typeof Tabs$1.Content>): React$1.JSX.Element;

declare function Textarea({ className, ...props }: React$1.ComponentProps<"textarea">): React$1.JSX.Element;

declare function TooltipProvider({ delayDuration, ...props }: React$1.ComponentProps<typeof Tooltip$1.Provider>): React$1.JSX.Element;
declare function Tooltip({ ...props }: React$1.ComponentProps<typeof Tooltip$1.Root>): React$1.JSX.Element;
declare function TooltipTrigger({ className, ...props }: React$1.ComponentProps<typeof Tooltip$1.Trigger>): React$1.JSX.Element;
declare function TooltipContent({ className, sideOffset, children, ...props }: React$1.ComponentProps<typeof Tooltip$1.Content>): React$1.JSX.Element;

type AppHeaderProps = Omit<ComponentProps<"header">, "children"> & {
    brand: ReactNode;
    navigation?: ReactNode;
    navigationLabel?: string;
    accountMenu?: ReactNode;
    /** Place the navigation at the true centre of the bar (brand left, account menu right). */
    centerNavigation?: boolean;
};
/** Applications supply their own router links and decide when account controls appear. */
declare function AppHeader({ brand, navigation, navigationLabel, accountMenu, centerNavigation, className, ...props }: AppHeaderProps): React$1.JSX.Element;

type FooterProps = ComponentProps<"footer"> & {
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
declare function Footer({ notices, links, linksLabel, copyright, compact, themeToggle, children, className, ...props }: FooterProps): React$1.JSX.Element;

declare const scoreStyles: {
    readonly good: "bg-score-good-bg text-score-good";
    readonly fair: "bg-score-fair-bg text-score-fair";
    readonly low: "bg-score-low-bg text-score-low";
};
type ScoreBadgeProps = ComponentProps<"span"> & {
    variant: keyof typeof scoreStyles;
};
/** A score's meaning stays visible in text as well as color. */
declare function ScoreBadge({ variant, children, className, ...props }: ScoreBadgeProps): React$1.JSX.Element;

type UsageMeterProps = Omit<ComponentProps<"div">, "children"> & {
    label: string;
    used: number;
    cap: number;
    periodLabel?: string;
};
/** Remaining allowance, with finite bounds and a readable zero-cap state. */
declare function UsageMeter({ label, used, cap, periodLabel, className, ...props }: UsageMeterProps): React$1.JSX.Element;

type SkipLinkProps = Omit<ComponentProps<"a">, "href"> & {
    targetId?: string;
};
declare function SkipLink({ targetId, children, onClick, className, ...props }: SkipLinkProps): React$1.JSX.Element;

/** Main content is focusable by SkipLink without entering the normal tab order. */
declare function Page({ id, tabIndex, className, ...props }: ComponentProps<"main">): React$1.JSX.Element;
/** Supply aria-label or aria-labelledby when the section should be a named region. */
declare function Section({ className, ...props }: ComponentProps<"section">): React$1.JSX.Element;

/** Label above a control; `children` receives the id to put on the control so the label names it. Pass `id` to fix it (else generated). */
declare function Field({ label, id: givenId, children }: {
    label: string;
    id?: string;
    children: (id: string) => ReactNode;
}): React$1.JSX.Element;

/**
 * Non-error notice. Alert has only default/destructive, so the amber "notice" look comes from semantic tokens.
 * No role by default (Alert's built-in role="alert" is cleared); pass `role` when the message is announced.
 */
declare function Notice({ children, className, role, ...props }: ComponentProps<typeof Alert>): React$1.JSX.Element;
/** Error text block (role=alert) for short inline failures. */
declare function ErrorNote({ children, className, ...props }: ComponentProps<typeof Alert>): React$1.JSX.Element;

/** Status colour only; the chip's own text always says what it means. Reused by the session list and the report. */
type ChipTone = "progress" | "wait" | "done" | "failed" | "agree" | "differs" | "flagged" | "neutral" | "muted";
/** Badge (which has no tone variants) plus a `data-tone` hook and token classes. Pass the visible text as children. */
declare function StatusChip({ tone, className, ...props }: {
    tone?: ChipTone;
} & Omit<ComponentProps<typeof Badge>, "variant">): React$1.JSX.Element;

/** True once `pending` has stayed true for `delayMs`; false again as soon as it settles (success or error). */
declare function useSlowPending(pending: boolean, delayMs?: number): boolean;
/** Friendly "server is waking up" note, shown only while a first request is still pending after the delay. */
declare function SlowStartNotice({ pending, delayMs }: {
    pending: boolean;
    delayMs?: number;
}): React$1.JSX.Element | null;

/**
 * Recovery copy is fixed: never expose exception messages or response bodies.
 * Callers map their own errors to a numeric `status` and a request `reference`; a reference that is not a plain id is ignored.
 */
declare function ErrorRecovery({ status, reference, homeHref, reload }: {
    status?: number;
    reference?: string;
    homeHref?: string;
    reload?: () => void;
}): React$1.JSX.Element;

type AccountMenuLink = {
    href: string;
    label: string;
};
/**
 * Avatar button at the far right of the header; opens the email, caller-supplied links and Sign out
 * (shared nonmodal DropdownMenu). Router-agnostic: `renderLink` returns the element that wraps each link.
 */
declare function AccountMenu({ email, links, renderLink, onSignOut }: {
    email: string | null;
    links?: AccountMenuLink[];
    renderLink?: (link: AccountMenuLink) => ReactElement;
    onSignOut: () => void;
}): React$1.JSX.Element;

/** Icon button cycling System -> Light -> Dark -> System; persists and sets `data-theme` on <html>. */
declare function ThemeToggle({ className }: {
    className?: string;
}): React$1.JSX.Element;

/** Theme preference: System (no override), Light or Dark. Stored in localStorage; applied as `data-theme` on <html>. */
type Theme = "system" | "light" | "dark";
declare function nextTheme(t: Theme): Theme;
declare function readTheme(): Theme;
declare function saveTheme(t: Theme): void;
declare function applyTheme(t: Theme): void;

/** Elapsed milliseconds as `m:ss`. */
declare function formatElapsed(ms: number): string;
/** A reset timestamp as a short local clock time with its time zone ("9:00 AM PST"); undefined when unparseable. */
declare function formatResetTime(iso: string | undefined): string | undefined;
/** A date as the person's own locale and time zone render it ("Nov 24, 2026"): the one format the report and the version list share. Unparseable input comes back as given. */
declare function formatDate(iso: string, opts?: {
    locale?: string;
    timeZone?: string;
}): string;

export { AccountMenu, Alert, AlertDescription, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger, AlertTitle, AppHeader, Badge, Button, Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Checkbox, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, ErrorNote, ErrorRecovery, Field, Footer, Input, Label, Notice, Page, Progress, ScoreBadge, Section, Select, Separator, Skeleton, SkipLink, SlowStartNotice, Spinner, StatusChip, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, ThemeToggle, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, UsageMeter, applyTheme, badgeVariants, buttonVariants, cn, formatDate, formatElapsed, formatResetTime, nextTheme, readTheme, saveTheme, tabsListVariants, useSlowPending };
export type { AccountMenuLink, AppHeaderProps, ChipTone, FooterProps, ScoreBadgeProps, SkipLinkProps, Theme as ThemePreference, UsageMeterProps };
