# Component stories

The catalogue has one title for each supported family: 19 UI primitives and fourteen
Onolys components. Compound exports are shown together in their owning family's
story. Variants, disabled/invalid/checked states, open overlays, and keyboard entry
points have dedicated examples.

Run `npm run storybook` to browse. Theme colors follow `prefers-color-scheme`;
use the browser's rendering/media emulation to inspect light and dark without
adding a theme class, storage, or a runtime toggle.

`npm run test:storybook` builds the real catalogue, checks all 33 family titles,
and serves it locally for serial Chromium scans with `@axe-core/playwright`.
The runner emulates light and dark and scans the whole story document, including
portals. It also exercises button focus, checkbox Space, tab arrow navigation,
native select keyboard changes, tooltip focus, SkipLink focus/fragment navigation,
Dialog Escape/focus return, and menu keyboard navigation. Only axe's page-level `region` best-practice rule is disabled, matching the
[Storybook addon default](https://storybook.js.org/docs/writing-tests/accessibility-testing#configure):
component portals and skip links can sit outside a page landmark. All default WCAG rules,
including color contrast, remains enabled.
Chromium must be installed with `npx playwright install chromium`.

`npm run test:storybook:negative` creates a separate temporary Storybook build
containing an intentionally unnamed button. It requires the same scanner to fail
with `button-name` in both schemes, then removes that build. The fixture is excluded
from the normal catalogue and is never an example of supported component usage.

The accessibility addon remains available in manual mode for inspecting stories
interactively. This prevents its automatic scan from racing the independent axe
runner against the same document.
Automated checks catch a subset of accessibility problems; keyboard flows have
explicit assertions in the runner rather than relying on axe to infer them.
