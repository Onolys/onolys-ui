# Onolys UI

Shared design tokens, styles, and React components for Onolys.

This repository will provide the `@onolys/ui` design system. The package currently
contains light and dark design tokens, a toolchain smoke component, and placeholder
component styles; no release is available yet.

## Development

Use Node.js 22.12 or newer. Install the locked dependencies with `npm ci`.
Install the Chromium browser for the CSS integration tests with `npx playwright install chromium`.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run build:storybook
```

`npm run storybook` starts the component workshop. `npm run build:watch` rebuilds
package source and copies its CSS when source files change.

The package builds ESM and TypeScript declarations with tsup and TypeScript 6.
React 19 and Tailwind CSS 4 are peer dependencies. CSS is copied as plain files,
separate from the JavaScript entry points. Built `dist/` files remain ignored during
development; release tags will carry the built files. There is no install-time
`prepare` build.

## Tokens

`src/tokens/tokens.ts` is the source of truth for both palettes, spacing,
typography, radius, and shadows. After changing it, regenerate the checked-in CSS:

```sh
npm run tokens:generate
npm test -- src/tokens/tokens.test.ts
```

The package's `tokens.css` export declares light variables in `:root` and overrides
them under `prefers-color-scheme: dark`. The `tokens` export provides `tokens.light`,
`tokens.dark`, their TypeScript types, and `contrastPairs`, the supported color
combinations. Normal text meets 4.5:1, including large text; control boundaries and
focus rings meet 3:1. Other combinations need their own contrast check. Use a focus
ring offset in the adjacent surface color, and the dedicated footer text/link/muted
tokens on footer backgrounds. Shadows and section bands are decorative.

The light teal primary and score palette preserve the Onolys brand colors. Semantic
border/input colors are stronger than the original decorative gray. Verdict and
role colors are adjusted where needed so text also stays readable on selected rows.

## Styles and migration

Import `@onolys/ui/theme.css` after Tailwind CSS in a consumer stylesheet. It includes
the token variables, base styles, self-hosted Inter, and animation utilities:

```css
@import "tailwindcss";
@import "@onolys/ui/theme.css";
@source "../node_modules/@onolys/ui/dist";
```

Token colors follow the operating system's light/dark preference. Base styles provide
a 3px keyboard focus outline, reduced motion, and CSS scroll locking via
`body[data-scroll-locked]`. The font is covered by [its own SIL OFL license](fonts/OFL.txt).
Set the consumer bundler's asset inline limit to zero to keep the font as a same-origin URL.

Apps migrating older Onolys CSS may additionally import `@onolys/ui/legacy.css`.
Its `--color-*` and typography aliases keep existing selectors usable. The legacy
light gray separator remains `#c7d1d0`; semantic `border` and `input` tokens use the
stronger accessible boundary color. New utility classes use semantic names directly.

## Component conventions

The scaffold uses Storybook 10.6 with Vite 8 and the accessibility addon.
[Storybook 10.3 introduced Vite 8 support](https://storybook.js.org/releases/10.3).

`components.json` follows the shadcn Tailwind v4 setup: the `new-york` style,
an empty Tailwind config path, CSS variables, and `src/styles/theme.css` as the
CSS entry. The theme uses `@theme inline` and imports `tw-animate-css`. Components
use `data-slot` attributes and React 19 ref props. See the
[shadcn Tailwind v4 conventions](https://ui.shadcn.com/docs/tailwind-v4).

Run shadcn inside this repository when reviewing upstream component changes:

```sh
npx shadcn@latest diff
npx shadcn@latest add button --diff
```

The second command previews changes without writing a component. Upstream defaults
still require review for Onolys sizing, theme, and accessibility requirements.

## License

[MIT](LICENSE)
