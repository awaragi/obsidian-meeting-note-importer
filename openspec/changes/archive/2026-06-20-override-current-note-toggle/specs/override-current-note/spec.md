## ADDED Requirements

### Requirement: OverrideToggleVisibility
The import modal SHALL display an "Override current note" toggle if and only if `app.workspace.getActiveFile()` returns a non-null value at the time `onOpen()` is called. The toggle SHALL default to OFF on every modal open.

#### Scenario: ActiveFileExists
- **WHEN** the import modal opens and the workspace has an active file
- **THEN** the "Override current note" toggle is rendered and defaults to OFF

#### Scenario: NoActiveFile
- **WHEN** the import modal opens and no file is active in the workspace
- **THEN** the "Override current note" toggle is not rendered

### Requirement: OverrideToggleSaveTo
When the "Override current note" toggle is OFF, the modal SHALL show the "Save to: <folder>" indicator. When the toggle is ON, that indicator SHALL be replaced with "Override: <activeFile.basename>.md".

#### Scenario: ToggleOffShowsSaveTo
- **WHEN** the override toggle is OFF
- **THEN** the "Save to: <folder>" label is visible and the override label is hidden

#### Scenario: ToggleOnShowsOverrideLabel
- **WHEN** the override toggle is turned ON
- **THEN** the "Save to:" label is hidden and "Override: <filename>.md" is shown instead

### Requirement: RenameToggleVisibility
The modal SHALL display a secondary "Also rename note" toggle if and only if the "Override current note" toggle is ON. The rename toggle SHALL default to OFF whenever the override toggle is turned ON.

#### Scenario: RenameToggleAppearsWithOverride
- **WHEN** the "Override current note" toggle is turned ON
- **THEN** the "Also rename note" toggle becomes visible and is OFF

#### Scenario: RenameToggleHiddenWithoutOverride
- **WHEN** the "Override current note" toggle is OFF
- **THEN** the "Also rename note" toggle is not visible

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
