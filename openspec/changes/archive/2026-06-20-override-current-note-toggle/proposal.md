## Why

When a user has a meeting note already open, re-importing the same event (e.g. after the invite is updated) requires manually finding and deleting the old note first. A one-click override mode on the import modal eliminates that friction by writing fresh template content directly into the currently open note.

## What Changes

- Import modal (`IcsDropModal`) gains an **Override current note** toggle, visible only when `app.workspace.getActiveFile()` returns a file at modal open time.
- When the toggle is ON, dropping or picking a file writes generated content into the active note via `vault.modify()` instead of creating a new file.
- A secondary **Also rename note** toggle appears when override is ON; when enabled, the active file is renamed to the computed note name (via `resolveNoteName`) using `app.fileManager.renameFile()` — keeping the file in its current folder and updating backlinks.
- If rename is ON and the computed name is already taken by a different file, the operation bails with a notice (same guard pattern as the existing "note exists" check).
- When override is ON the **Save to: folder** indicator is hidden; a **Override: filename.md** label is shown instead.
- The toggle callbacks (`onDrop`, `onFilePicked`) are enriched with an `OverrideOptions` param so state flows through the call rather than via shared mutable reference.
- New `overrideMeetingNote()` function in `noteCreator.ts` handles modify + optional rename.
- New i18n strings for toggle labels and the override indicator.

## Capabilities

### New Capabilities

- `override-current-note`: Overriding the currently open note with freshly generated meeting-note content (and optionally renaming it) during an import.

### Modified Capabilities

- `note-creator`: `createMeetingNote` call path now conditionally routes to `overrideMeetingNote`; callback signatures in the modal gain an `OverrideOptions` argument.

## Impact

- **`src/ts/main.ts`**: `IcsDropModal` constructor and `onOpen()`; callback type signatures; `handleDrop`, `readFileAsText`, `processEvent` methods on the plugin.
- **`src/ts/noteCreator.ts`**: New exported `overrideMeetingNote()` function.
- **`src/ts/i18n/en.json`** (and `fr.json`, `es.json`): New translation keys.
- No new dependencies. No breaking changes to the public API or settings schema.
