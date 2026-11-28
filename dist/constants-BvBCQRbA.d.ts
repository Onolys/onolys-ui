/** All package constants live here (coding rule 10). Apps own their own routes, hosts and contact details. */
/** localStorage key for the theme preference. `scripts/theme-init.template.js` is generated from this value. */
declare const THEME_STORAGE_KEY = "onolys-theme";
/** How long a request stays pending before the "server is waking up" note appears. */
declare const SLOW_START_MS = 2000;
/** Fixed sign-in routes served by `@onolys/common/auth`. Apps mount the pages at exactly these paths. */
declare const AUTH_PATHS: {
    readonly login: "/login";
    readonly signup: "/signup";
    readonly forgotPassword: "/forgot-password";
    readonly verifyEmail: "/verify-email";
    readonly action: "/auth/action";
};
/** Layout/text class constants shared by screens (semantic tokens only). */
declare const H1 = "m-0 text-2xl font-semibold";
/** Page stack: heading, notices, forms. */
declare const PAGE = "grid gap-4";
declare const NOTE = "text-sm text-muted-foreground";
declare const LINK = "text-primary underline underline-offset-4";
/** Link-style button sits flush with the text around it (no horizontal padding). */
declare const LINK_BTN = "px-0";
declare const ACTIONS = "flex flex-wrap items-center gap-3";
/** Plain text nav link: muted, subtle hover, current page = primary colour + underline. */
declare const NAV_LINK = "text-sm font-medium text-muted-foreground no-underline hover:text-foreground aria-[current=page]:text-primary aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8";
/** AppHeader `centerNavigation`: nav sits at the true centre of the bar. */
declare const HEADER_CENTER_NAV = "relative [&>nav]:absolute [&>nav]:left-1/2 [&>nav]:-translate-x-1/2";

export { AUTH_PATHS as A, H1 as H, LINK as L, NAV_LINK as N, PAGE as P, SLOW_START_MS as S, THEME_STORAGE_KEY as T, ACTIONS as a, HEADER_CENTER_NAV as b, LINK_BTN as c, NOTE as d };
