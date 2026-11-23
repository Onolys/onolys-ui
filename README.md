# Onolys UI

Shared design tokens, styles, and React components for Onolys.

This repository will provide the `@onolys/ui` design system. The package currently
contains light and dark design tokens and accessible React primitives; no release
is available yet.

## Development

Use Node.js 22.23.4 or newer for the full test toolchain, including Astro 7.
The package engine remains Node.js 22.12+. Install the locked dependencies with `npm ci`.
Install the Chromium browser for the CSS integration tests with `npx playwright install chromium`.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run build:storybook
```

Run the packed Vite and Astro consumer checks independently with:

```sh
npm test -- src/consumer-fixtures.test.ts
```

They install the tarball into separate temporary consumers, build both frameworks,
and verify strict CSP, automatic dark mode, same-origin font files, and the package
`@source` recipe. Negative controls remove `@source` and inject an inline stylesheet.
The Astro consumer imports only theme CSS and builds without React peers or client JavaScript.

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

The named package exports include Button, Input, Label, Textarea, Select, Checkbox,
Tabs, Card, Badge, Alert, Table, Dialog, AlertDialog, DropdownMenu, Separator,
Skeleton, Tooltip, and their composition helpers. Interactive defaults have at
least a 44px target; all button size names keep that minimum, including icon sizes.
Radix primitives retain their keyboard behavior and accept caller labels and React
refs. Select uses native browser keyboard and form behavior.
Use DialogTitle/DialogDescription and AlertDialogTitle/AlertDialogDescription to
name and describe overlays, and wrap tooltips in TooltipProvider.

The primitives come from the new-york registry through shadcn CLI 4.23.0, with
Onolys semantic colors, automatic dark mode, and opaque 3px focus rings. The
upstream MIT notice is included in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Dialogs and alert dialogs retain Radix modal content, focus trapping, dismissal
callbacks, and confirmation/cancel behavior. Their backdrops use bundled CSS, with
counted `body[data-scroll-locked]` locks that restore previous state after the last
modal closes. DropdownMenu is always non-modal and does not accept a `modal` prop.
These choices support an enforced `style-src 'self'` policy without injected styles.

Select is a styled native `<select>` because Radix Select injects runtime stylesheets
that Chromium blocks under that policy. Use native `<option>` and `<optgroup>`
children, native `onChange`, and normal React select props (`value`, `defaultValue`,
`name`, `required`, `disabled`, `multiple`, and numeric `size`). Radix composition
helpers such as SelectTrigger, SelectContent, and SelectItem are not exported.

```tsx
<Select name="language" aria-label="Language" defaultValue="en">
  <option value="en">English</option>
  <option value="fr">French</option>
</Select>
```

The focused `overlay-csp.test.ts` regression builds the package and verifies these
controls in Chromium under `style-src 'self'`. A raw Radix Select case deliberately
reproduces the blocked inline stylesheets, keeping the reason for the fallback
testable. Dialog/AlertDialog/Menu checks run in both automatic color themes.

Run shadcn inside this repository when reviewing upstream component changes:

```sh
npx shadcn@latest diff
npx shadcn@latest add button --diff
```

The second command previews changes without writing a component. Upstream defaults
still require review for Onolys sizing, theme, and accessibility requirements.

## License

[MIT](LICENSE)
