# Override-current-note Specification

## Purpose

Provides the "Override current note" feature in the import modal: when a file is active at modal
open time, the user can toggle override mode to write freshly generated meeting-note content into
the active file instead of creating a new one. A secondary rename toggle allows the active file to
be renamed to the computed note name in the same operation.

## Requirements

> `src/ts/main.ts`

### Requirement: OverrideToggleVisibility
The import modal SHALL display an "Override current note" toggle if and only if `app.workspace.getActiveFile()` returns a non-null value at the time `onOpen()` is called. The toggle SHALL default to OFF on every modal open.

#### Scenario: ActiveFileExists
- **WHEN** the import modal opens and the workspace has an active file
- **THEN** the "Override current note" toggle is rendered and defaults to OFF

#### Scenario: NoActiveFile
- **WHEN** the import modal opens and no file is active in the workspace
- **THEN** the "Override current note" toggle is not rendered

### Requirement: OverrideToggleSaveTo
When the "Override current note" toggle is OFF, the modal SHALL show the "Save to: <folder>" indicator. When the toggle is ON, that indicator SHALL be replaced with "The meeting will override the note: <activeFile.basename>.md".

#### Scenario: ToggleOffShowsSaveTo
- **WHEN** the override toggle is OFF
- **THEN** the "Save to: <folder>" label is visible and the override label is hidden

#### Scenario: ToggleOnShowsOverrideLabel
- **WHEN** the override toggle is turned ON
- **THEN** the "Save to:" label is hidden and "The meeting will override the note: <filename>.md" is shown instead

### Requirement: RenameToggleVisibility
The modal SHALL display a secondary "Also rename the note accordingly" toggle if and only if the "Override current note" toggle is ON. The rename toggle SHALL default to OFF whenever the override toggle is turned ON.

#### Scenario: RenameToggleAppearsWithOverride
- **WHEN** the "Override current note" toggle is turned ON
- **THEN** the "Also rename the note accordingly" toggle becomes visible and is OFF

#### Scenario: RenameToggleHiddenWithoutOverride
- **WHEN** the "Override current note" toggle is OFF
- **THEN** the "Also rename the note accordingly" toggle is not visible

### Requirement: OverrideOptionsPassedToCallback
When the user drops or picks a file, the modal SHALL pass the current toggle state as an `OverrideOptions` object `{ overrideNote: TFile | null, renameNote: boolean }` to the `onDrop` / `onFilePicked` callbacks before closing.

#### Scenario: OverrideOffCallbackOptions
- **WHEN** a file is dropped with the override toggle OFF
- **THEN** the callback receives `{ overrideNote: null, renameNote: false }`

#### Scenario: OverrideOnNoRenameCallbackOptions
- **WHEN** a file is dropped with the override toggle ON and rename toggle OFF
- **THEN** the callback receives `{ overrideNote: <activeFile>, renameNote: false }`

#### Scenario: OverrideOnWithRenameCallbackOptions
- **WHEN** a file is dropped with both toggles ON
- **THEN** the callback receives `{ overrideNote: <activeFile>, renameNote: true }`
