# Changelog

All notable changes to this project are recorded here using Keep a Changelog.
Versions follow Semantic Versioning; before 1.0, minor releases may break APIs.

## [Unreleased]

## [0.4.0] - 2026-11-28

### Added

- Package renamed to `@onolys/common` (was `@onolys/ui`); update installs and imports.
- Root components and helpers: `Field`, `Notice`, `ErrorNote`, `StatusChip`, `SlowStartNotice` (`useSlowPending`), `ErrorRecovery`, `AccountMenu`, `ThemeToggle`, theme helpers (`applyTheme`, `readTheme`, `saveTheme`, `nextTheme`), format helpers (`formatDate`, `formatElapsed`, `formatResetTime`) and shared class constants. `AppHeader` gains `centerNavigation`; `Footer` gains `compact` and `themeToggle`.
- `@onolys/common/auth`: provider-neutral sign-in (`AuthProvider`, route guards, `Login`, `Signup`, `VerifyEmail`, `ForgotPassword`, `AuthAction`, error mapping, next-URL helpers). Needs `react-router` and `@tanstack/react-query`.
- `@onolys/common/auth/firebase`: `createFirebaseAuthService` and `EmailApi`, the Firebase implementation of the auth service. Needs `firebase`.
- `@onolys/common/auth/testing`: helpers that drive the real Firebase service against the Auth emulator in tests.
- `@onolys/common/theme-init.js` pre-paint theme script export.
- `react-router`, `@tanstack/react-query` and `firebase` are optional peer dependencies; the root entry and the CSS exports load none of them. Entries share chunks, so a component ships once.
- Storybook families for the new components.

### Changed

- Privacy guard exceptions: `src/lib/theme.ts` may use `localStorage` for the theme preference; `src/auth/testing.ts` may call `fetch` against the emulator URL. No other file may.

### Removed

- Breaking: `legacy.css` is removed. Use `theme.css` with the semantic tokens.

## [0.3.0] - 2026-11-24

### Added

- `Spinner`: decorative busy ring that spins only under `motion-safe` and stays a static ring under reduced motion.
- `Progress`: native `<progress>` styled with tokens; takes caller `aria-label`/`aria-valuetext`, no fill transition under reduced motion.

## [0.2.0] - 2026-11-23

### Added

- Manual theme override: set `data-theme="light"` or `data-theme="dark"` on `<html>` to force a theme regardless of the OS setting; with no attribute the theme still follows `prefers-color-scheme`. `color-scheme` follows the override.
- `success` and `warning` status text colours (`text-success`, `text-warning`, alongside `text-destructive`) in light and dark, each at least 4.5:1 on `background` and `card`.

## [0.1.0] - 2026-11-23

### Added

- Shared semantic tokens, automatic light/dark themes, Tailwind v4 mappings, and self-hosted Inter.
- Accessible React primitives and reusable application chrome with 44px interactive targets.
- CSP-compatible dialogs and menus, and a native Select with normal browser form behavior.
- Contrast, privacy, keyboard, geometry, Storybook accessibility, and consumer integration checks.
- ESM and TypeScript declarations, CSS-only Astro support, and immutable Git release artifacts.
