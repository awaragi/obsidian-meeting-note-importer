## Why

The existing command name ("Import meeting note from calendar invite") no longer reflects the plugin's dual capability now that manual entry exists. Users also need a dedicated command to jump straight to the Quick/Manual Entry tab — so they can assign a hotkey for fast note creation without touching a file. A ribbon visibility toggle rounds this out for users who prefer a minimal UI.

## What Changes

- Rename the existing command `import-ics-meeting-note` label from "Import meeting note from calendar invite" to "Open meeting note importer" (the modal now does more than import).
- Add a new command `new-quick-meeting-note` labelled "New quick meeting note" that opens the modal pre-switched to the Quick/Manual Entry tab with the title input focused.
- Add a `showRibbonIcon` boolean setting (default `true`). When `false`, the ribbon icon is not registered. Changing the setting takes effect after Obsidian reload (standard plugin pattern).
- Add i18n keys for the new command name and the new setting.

## Capabilities

### New Capabilities

- `quick-entry-command`: A second plugin command that opens the modal directly on the Quick/Manual Entry tab with the title field focused.

### Modified Capabilities

- `settings`: New `showRibbonIcon` boolean field added to `IcalMeetingNotesSettings`.
- `i18n`: New string keys for the new command and ribbon setting (EN/FR/ES).

## Impact

- `src/ts/main.ts`: Rename existing command label; add new command; conditionally register ribbon icon based on setting.
- `src/ts/settingsTab.ts`: Add `showRibbonIcon` field to interface and defaults; add toggle to settings UI.
- `src/ts/i18n/en.json`, `fr.json`, `es.json`: New keys.
- `IcsDropModal`: Accept an optional `initialTab` parameter (`"file" | "manual"`) to control which tab is active on open.
