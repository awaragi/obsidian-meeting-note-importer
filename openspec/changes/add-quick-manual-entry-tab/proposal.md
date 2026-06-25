## Why

The plugin currently only creates meeting notes from imported calendar files (.ics). Users who want to create a meeting note on the fly — without a calendar file — have no quick path. Adding a manual entry tab lets the plugin serve both import and ad-hoc creation workflows without leaving Obsidian.

## What Changes

- The import modal gains a tab structure: **"From File"** (existing ICS drop zone) and **"Quick/Manual Entry"** (new form).
- The shared section outside the tabs (save-to label, override toggle, rename toggle) applies to both tabs equally.
- The new tab provides: title (defaults to localized "Untitled"), date (`<input type="date">`, defaults to today), start time (`<input type="time">`, defaults to current time rounded to nearest increment), end time (same component, defaults to start + increment). Shift+↑↓ on time fields jumps by the configured increment.
- A new **time increment** setting (dropdown: 15 / 30 / 60 min, default 30) is added. This drives start-time rounding and the end-time default.
- Both tabs produce a `MeetingEvent` and call the existing `processEvent()`. No changes to `noteCreator.ts`.
- All new UI strings are added to the EN / FR / ES i18n files.

## Capabilities

### New Capabilities

- `quick-manual-entry`: Manual meeting note creation form inside the import modal — title, date, start/end time inputs with native browser controls and keyboard shortcuts.

### Modified Capabilities

- `settings`: New `timeIncrement` field (15 | 30 | 60, default 30).
- `i18n`: New string keys for the tab labels, form field labels, and placeholder text (EN/FR/ES).

## Impact

- `src/ts/main.ts`: Modal refactored to add tab UI; `IcsDropModal` restructured so shared controls live outside tabs; new manual-entry form added.
- `src/ts/settingsTab.ts`: New `timeIncrement` setting added to schema and settings tab UI.
- `src/ts/i18n/en.json`, `fr.json`, `es.json`: New string keys.
- `src/css/styles.css`: Tab styling and calendar/time picker indicator suppression.
- `noteCreator.ts`, `icalParser.ts`: No changes.
