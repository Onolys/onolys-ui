# Changelog

All notable changes to this project are recorded here using Keep a Changelog.
Versions follow Semantic Versioning; before 1.0, minor releases may break APIs.

## [Unreleased]

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
