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
When the "Override current note" toggle is OFF, the modal SHALL show the "Save to: <folder>" indicator. When the toggle is ON, that indicator SHALL be replaced with a context-sensitive label whose text depends on the rename toggle state:
- Override ON, rename OFF: "Replacing content of / <activeFile.basename>.md"
- Override ON, rename ON: "Replacing note / <activeFile.basename>.md"

The label text SHALL update live as the rename toggle is flipped while override is ON. When override is turned back OFF, the label SHALL reset to the "Replacing content of" variant so it is consistent on the next enable.

#### Scenario: ToggleOffShowsSaveTo
- **WHEN** the override toggle is OFF
- **THEN** the "Save to: <folder>" label is visible and the override label is hidden

#### Scenario: ToggleOnShowsContentLabel
- **WHEN** the override toggle is turned ON with the rename toggle OFF
- **THEN** the "Save to:" label is hidden and "Replacing content of / <filename>.md" is shown

#### Scenario: RenameOnUpdatesLabelToReplaceNote
- **WHEN** the override toggle is ON and the rename toggle is turned ON
- **THEN** the label text changes from "Replacing content of" to "Replacing note"

#### Scenario: RenameOffRevertsLabelToContentVariant
- **WHEN** both toggles are ON and the rename toggle is turned OFF
- **THEN** the label text reverts to "Replacing content of"

#### Scenario: OverrideOffResetsLabel
- **WHEN** the override toggle is turned OFF while the rename toggle was ON
- **THEN** the override label is hidden and the internal text resets to "Replacing content of" for the next enable

### Requirement: RenameToggleVisibility
The modal SHALL display a secondary "Also rename the note accordingly" toggle if and only if the "Override current note" toggle is ON. When the override toggle is turned ON, the rename toggle SHALL initialise to the value of `settings.overrideRenameDefault` (rather than always OFF). When the override toggle is turned OFF, the rename toggle SHALL reset to OFF regardless of the setting. The override label SHALL reflect the seeded rename value immediately — if `overrideRenameDefault` is true the label displays "Replacing note" as soon as override is enabled.

#### Scenario: RenameToggleAppearsWithOverride_DefaultFalse
- **WHEN** the "Override current note" toggle is turned ON and `overrideRenameDefault` is `false`
- **THEN** the rename toggle becomes visible and is initialised to OFF

#### Scenario: RenameToggleAppearsWithOverride_DefaultTrue
- **WHEN** the "Override current note" toggle is turned ON and `overrideRenameDefault` is `true`
- **THEN** the rename toggle becomes visible and is initialised to ON, and the override label shows "Replacing note"

#### Scenario: RenameToggleHiddenWithoutOverride
- **WHEN** the "Override current note" toggle is OFF
- **THEN** the "Also rename the note accordingly" toggle is not visible

#### Scenario: RenameToggleResetsOnOverrideOff
- **WHEN** the override toggle is turned OFF while the rename toggle was ON (regardless of `overrideRenameDefault`)
- **THEN** the rename toggle is reset to OFF

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
