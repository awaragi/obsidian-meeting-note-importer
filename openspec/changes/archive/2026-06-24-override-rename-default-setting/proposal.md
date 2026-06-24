## Why

When a user always wants the override toggle to also rename the note, they currently have to enable two toggles on every import. A persisted default for the rename toggle eliminates that extra step.

## What Changes

- Add a new `overrideRenameDefault` boolean setting (default `false`) to `IcalMeetingNotesSettings`
- Expose it in the settings tab as a toggle: "Rename note by default when overriding"
- When the override modal opens and the override toggle is turned ON, the rename toggle SHALL initialise to the value of `overrideRenameDefault` instead of always starting as OFF
- When the override toggle is turned OFF, the rename toggle resets to OFF regardless of the setting (existing behaviour, unchanged)

## Capabilities

### New Capabilities

_(none — this change only extends existing capabilities)_

### Modified Capabilities

- `override-current-note`: The rename toggle's initial value when override is enabled changes from a hardcoded `false` to the `overrideRenameDefault` setting value.
- `settings`: A new `overrideRenameDefault` field is added to `IcalMeetingNotesSettings` and rendered in the settings UI.

## Impact

- `src/ts/settingsTab.ts` — new toggle row in the settings tab; new field in `DEFAULT_SETTINGS` and `IcalMeetingNotesSettings`
- `src/ts/main.ts` — `IcsDropModal` reads the new setting when initialising the rename toggle
- All three i18n files (`en.json`, `fr.json`, `es.json`) — new translation keys for the setting name and description
