## Context

The plugin currently has a single `IcsDropModal` class in `src/ts/main.ts` that renders a drop zone for .ics files, with override/rename controls below. The `processEvent(event, opts)` method is the terminal for note creation and is completely source-agnostic — it accepts a `MeetingEvent` and `OverrideOptions` regardless of origin.

The new tab adds a second path to produce a `MeetingEvent` (manual form) while reusing all downstream logic unchanged.

## Goals / Non-Goals

**Goals:**
- Add a tab UI to `IcsDropModal` with "From File" and "Quick/Manual Entry" panels
- Move shared controls (save-to label, override/rename toggles) outside the tab panels
- Implement the manual form using native `<input type="date">` and `<input type="time">` for zero-dependency keyboard navigation and locale-aware 12/24 hr display
- Add `timeIncrement` setting driving start-time rounding and end-time default
- Add all new i18n keys to EN/FR/ES

**Non-Goals:**
- Changes to `noteCreator.ts` or `icalParser.ts`
- Custom date/time picker widgets
- Attendees, location, or description fields in the manual form

## Decisions

### D1: Native `<input type="time">` and `<input type="date">` over custom widgets

Electron 39 (Obsidian 1.12+) ships Chromium ~130, which gives full segment-aware keyboard navigation for both input types natively. 12/24 hr display follows the system locale automatically. The only custom code needed is a `keydown` handler for Shift+↑↓ on time fields (jump by increment). This avoids a custom time-picker widget entirely.

**Alternative considered**: Custom segmented inputs (like the time-picker described in exploration). Rejected: significant implementation complexity for behaviour the browser already provides for free.

### D2: `step` attribute set to increment in seconds on time inputs

Setting `step="1800"` (for 30 min) on `<input type="time">` makes native ↑↓ on the minute segment snap to increment boundaries. This means Shift+↑↓ (jump-by-increment) is somewhat redundant for the minute segment but is kept for power users who want to jump a full increment from the hours segment or any mid-segment cursor position.

### D3: Modal refactor — keep `IcsDropModal`, restructure `onOpen()`

Rather than creating a new modal class, `IcsDropModal` is refactored in place:
- Tab bar rendered at the top of `contentEl`
- Two panel divs toggled visible/hidden on tab click
- Panel 1: existing drop zone (unchanged)
- Panel 2: new manual form
- Shared section appended after both panels

This keeps the diff focused and the class cohesive.

### D4: `timeIncrement` as `15 | 30 | 60` union type, not `number`

A free number field would accept invalid values (e.g. 7 min) and complicate rounding logic. A three-value union `15 | 30 | 60` covers all realistic meeting slots and maps cleanly to a settings dropdown.

### D5: End time is independently editable (no locked relationship to start)

Start time change does NOT auto-update end time after the form opens. The default (start + increment) is set once on open. If the user changes start time, end time retains its value. This avoids surprising resets and keeps the two fields independent, consistent with how calendar apps behave.

### D6: No custom keyboard handler — `step` is sufficient

In Chromium's `<input type="time">`, ↑↓ on the minute segment increments by `step / 60` minutes. Setting `step` to increment-in-seconds (e.g. `1800` for 30 min) means the minute segment already snaps to increment boundaries natively. No custom `keydown` handler is needed. A Shift+↑↓ shortcut was considered but dropped as redundant — it would only add value for jumping by increment from the hours segment, which is not a meaningful use case.

## Risks / Trade-offs

- **Native calendar popup** → left intact. The popup closes cleanly with Escape, Tab, or Enter; keyboard segment navigation works normally after dismissal. If z-index rendering inside the Obsidian modal proves problematic at implementation time, a single CSS rule can suppress it then.
- **Segment navigation on date input** — native ↑↓ in Chromium moves by the segment under the cursor (day, month, or year). This is the exact behaviour the user asked for; no custom code needed.
- **12-hr AM/PM display** — the browser renders AM/PM natively on en-US and similar locales. The `.value` is always `HH:MM` in 24-hr internally, so JS logic is locale-independent.

## Migration Plan

No data migration needed. `timeIncrement` is a new optional field with a default; existing stored settings load and merge via the existing `Object.assign({}, DEFAULT_SETTINGS, stored)` pattern.

## Open Questions

None — all design decisions resolved during exploration.
