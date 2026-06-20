## Context

The import modal (`IcsDropModal`) is a one-shot drop target: it captures a file, fires a callback, and closes. State has always been zero — the modal has no toggles and no instance data beyond what was passed in at construction. Adding the override toggle means introducing per-session UI state and enriching the callback protocol without breaking the existing create-new-note path.

Currently `onDrop` and `onFilePicked` are typed as plain `(e: DragEvent) => void` / `(file: File) => void`. The plugin wires these at `openDropModal()` time and they close over nothing beyond `this` (the plugin). The modal closes before any async processing runs.

## Goals / Non-Goals

**Goals:**
- Show an "Override current note" toggle in the modal only when `app.workspace.getActiveFile()` is non-null at `onOpen()` time.
- When override is ON, write generated content to the active file (`vault.modify`) instead of creating a new one.
- Show a secondary "Also rename note" toggle (visible only while override is ON) that, when enabled, renames the active file to the `resolveNoteName`-computed name using `app.fileManager.renameFile()`.
- Hide the "Save to:" indicator when override is ON; show "Override: filename.md" instead.
- Bail with a notice (no write) if rename is ON and the target name already belongs to a different file.
- All toggle state is ephemeral (resets to OFF on next modal open).

**Non-Goals:**
- Persisting toggle preferences across sessions.
- Moving the file to a different folder on rename (folder stays as-is).
- Partial-merge or diff-based override (full template replacement only).
- Changing the settings schema.

## Decisions

### D1 — State flows through callbacks (Option A)

Callback signatures are widened to carry an `OverrideOptions` object:

```typescript
interface OverrideOptions {
  overrideNote: TFile | null;   // non-null when override toggle is ON
  renameNote: boolean;          // true when secondary rename toggle is ON
}

type OnDropFn    = (e: DragEvent, opts: OverrideOptions) => void;
type OnPickedFn  = (file: File,   opts: OverrideOptions) => void;
```

The modal reads its own toggle state at the moment the user drops/picks and packages it into `opts` before firing. The plugin receives it in `handleDrop` / `readFileAsText`, passes it through `processIcsContent` → `processEvent`, and routes to either `createMeetingNote` or `overrideMeetingNote`.

**Alternative considered — plugin holds modal reference and reads toggles after callback fires.** Rejected: requires the plugin to store a reference to an already-closed modal; couples the plugin to modal internals; harder to test.

### D2 — `overrideMeetingNote` is a new function in `noteCreator.ts`

Rather than adding a flag to `createMeetingNote`, a separate function keeps the create path untouched and makes the override path independently testable:

```typescript
export async function overrideMeetingNote(
  app: App,
  event: MeetingEvent,
  settings: IcalMeetingNotesSettings,
  targetFile: TFile,
  rename: boolean
): Promise<TFile>
```

Internally it: loads template → fills placeholders → injects attendees/notes → calls `vault.modify(targetFile, content)`. If `rename` is true: computes new name, checks for conflict, calls `app.fileManager.renameFile(targetFile, newPath)`, returns the (now-renamed) file.

### D3 — Active file captured at `onOpen()`, not at drop time

`this.activeFile = app.workspace.getActiveFile()` runs in `onOpen()`. This snapshot is stable for the lifetime of the modal and avoids a race where the active file changes between toggle interaction and drop.

### D4 — UI: toggle placement and Save-to visibility

The location indicator (`ical-save-location`) is rendered conditionally:
- Override OFF → show `Save to: <folder>` as before.
- Override ON → show `Override: <activeFile.basename>.md`.

Both labels live inside the drop zone. The toggle rows are rendered below the zone using Obsidian's `Setting` component (consistent with the settings tab style). The secondary rename toggle is created once and its container element is toggled hidden/visible when the primary toggle changes.

## Risks / Trade-offs

- **`fileManager.renameFile` touches backlinks across the vault** — this is the desired behaviour (keeps links intact) but could be slow on large vaults. Mitigation: acceptable for a user-triggered one-shot operation; no async timeout needed.
- **Override is destructive** — content that was in the note before is gone. Mitigation: this is explicitly what the user asked for; no undo beyond Obsidian's built-in Ctrl-Z file recovery.
- **Snapshot race** — if the user switches the active file while the modal is open and then drops, the override targets the file that was active at open time. Mitigation: acceptable UX; label in the modal shows which file will be overridden, so the user has a visual cue.

## Migration Plan

No schema changes. No data migrations. The override path is opt-in per import (toggle defaults OFF). Existing imports are unaffected.
