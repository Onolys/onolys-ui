/** All package constants live here (coding rule 10). Apps own their own routes, hosts and contact details. */

/** localStorage key for the theme preference. `scripts/theme-init.template.js` is generated from this value. */
export const THEME_STORAGE_KEY = "onolys-theme";

/** How long a request stays pending before the "server is waking up" note appears. */
export const SLOW_START_MS = 2000;

/** Fixed sign-in routes served by `@onolys/common/auth`. Apps mount the pages at exactly these paths. */
export const AUTH_PATHS = {
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  verifyEmail: "/verify-email",
  action: "/auth/action",
} as const;

/** Layout/text class constants shared by screens (semantic tokens only). */
export const H1 = "m-0 text-2xl font-semibold";
/** Page stack: heading, notices, forms. */
export const PAGE = "grid gap-4";
export const NOTE = "text-sm text-muted-foreground";
export const LINK = "text-primary underline underline-offset-4";
/** Link-style button sits flush with the text around it (no horizontal padding). */
export const LINK_BTN = "px-0";
export const ACTIONS = "flex flex-wrap items-center gap-3";

/** Plain text nav link: muted, subtle hover, current page = primary colour + underline. */
export const NAV_LINK =
  "text-sm font-medium text-muted-foreground no-underline hover:text-foreground aria-[current=page]:text-primary aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8";

/** AppHeader `centerNavigation`: nav sits at the true centre of the bar. */
export const HEADER_CENTER_NAV = "relative [&>nav]:absolute [&>nav]:left-1/2 [&>nav]:-translate-x-1/2";

/** Footer `compact`: one centred, small-type block with an optional corner theme toggle. */
export const FOOTER_COMPACT =
  "relative [&_a]:min-w-0! [&_a]:underline flex flex-wrap items-center justify-center gap-x-4 gap-y-0 space-y-0 px-gutter py-3 text-center text-xs [&>nav]:w-full [&>nav]:items-center [&>nav]:justify-center [&>nav]:gap-x-5 [&>nav]:px-9";
