# Frontend design rules

Apply to every UI: `web/`, `eval/web`. Read before changing frontend code.

UI pieces come from `@onolys/common`.

## Rules

1. **No horizontal scroll, anywhere.**
   - Do: fit the viewport. Wrap text, truncate with the full value in a tooltip or popup, hide low-priority columns on narrow screens, or switch to a stacked/card layout.
   - Don't: let a table, code block or layout overflow sideways.

2. **Configs open in a popup (modal).**
   - Do: open every config in a modal.
   - Don't: expand it inline or send the user to a separate page.

3. **Information is formatted to be read, not dumped.**
   - Do: use color coding, icons, status chips/badges, cards, and deliberate grouping and placement.
   - Don't: render run-on plain text or raw key/value blobs.

4. **Table headers are headers, not buttons.**
   - Do: plain header cells; sortable columns show up/down arrow indicators.
   - Don't: style headers as buttons.

5. **Notes, caveats and footnotes are secondary.**
   - Do: muted color, smaller text.
   - Don't: give them the same weight as primary content.

6. **Buttons show actions, not data.**
   - Do: label with the verb ("Open config", "Retry"); show IDs in the popup or details, copyable.
   - Don't: put IDs or other data inside a button label.
