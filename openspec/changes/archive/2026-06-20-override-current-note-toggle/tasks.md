## 1. Types and Callback Protocol

- [x] 1.1 Define `OverrideOptions` interface (`{ overrideNote: TFile | null; renameNote: boolean }`) and widen `onDrop`/`onFilePicked` callback types in `IcsDropModal` constructor
- [x] 1.2 Update `handleDrop` and `readFileAsText` in the plugin to accept and forward `OverrideOptions` through to `processIcsContent` / `processEvent`

## 2. `overrideMeetingNote` in noteCreator.ts

- [x] 2.1 Add `overrideMeetingNote(app, event, settings, targetFile, rename)` function that runs the same template pipeline (load template → fill placeholders → inject attendees/notes) then calls `vault.modify(targetFile, content)`
- [x] 2.2 Implement rename branch: compute `resolveNoteName` → build new path in same folder → check for conflict (bail with notice if a different file exists at that path) → call `app.fileManager.renameFile`
- [x] 2.3 Handle the no-op rename case: if computed path equals `targetFile.path`, skip rename and return the file as-is

## 3. Modal UI — Override Toggle

- [x] 3.1 In `IcsDropModal.onOpen()`, capture `this.activeFile = app.workspace.getActiveFile()` and store `this.overrideNote = false` / `this.renameNote = false` instance vars
- [x] 3.2 Render the "Override current note" toggle using Obsidian's `Setting` component, below the drop zone, only when `this.activeFile` is non-null
- [x] 3.3 On toggle change: update `this.overrideNote`; swap the save-to / override label visibility; show/hide the rename toggle row

## 4. Modal UI — Save-to / Override Label

- [x] 4.1 Render the "Save to: <folder>" label as before when override is OFF
- [x] 4.2 On override toggle ON, hide the "Save to:" label and show "Override: <activeFile.basename>.md" in its place (both elements created at `onOpen()` time, toggled with CSS `display`)

## 5. Modal UI — Rename Toggle

- [x] 5.1 Render the "Also rename note" `Setting` toggle row (hidden by default) immediately after the override toggle row
- [x] 5.2 When override toggle turns ON, make the rename row visible and reset rename to OFF; when override toggle turns OFF, hide the rename row and reset rename to OFF

## 6. Routing in `processEvent`

- [x] 6.1 In `processEvent`, branch on `opts.overrideNote`: if non-null call `overrideMeetingNote(app, event, settings, opts.overrideNote, opts.renameNote)`; otherwise keep existing `createMeetingNote` path

## 7. i18n

- [x] 7.1 Add translation keys to `en.json`: `modal.override_toggle`, `modal.rename_toggle`, `modal.override_label`, `notice.override_conflict`
- [x] 7.2 Add the same keys to `fr.json` and `es.json` (English fallback acceptable for initial release)
