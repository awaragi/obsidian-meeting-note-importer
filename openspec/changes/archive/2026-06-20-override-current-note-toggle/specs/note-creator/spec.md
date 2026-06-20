## ADDED Requirements

### Requirement: OverrideMeetingNote
The system SHALL provide an `overrideMeetingNote(app, event, settings, targetFile, rename)` function that overwrites the content of an existing vault file with freshly generated meeting-note content (same template pipeline as `createMeetingNote`) and optionally renames the file.

#### Scenario: OverrideWritesContent
- **WHEN** `overrideMeetingNote` is called with `rename: false`
- **THEN** the target file's content is replaced via `vault.modify` using the rendered template, and the same file (TFile) is returned

#### Scenario: OverrideWithRenameSuccess
- **WHEN** `overrideMeetingNote` is called with `rename: true` and the computed name does not already exist in the folder
- **THEN** content is written, the file is renamed via `app.fileManager.renameFile`, and the renamed TFile is returned

#### Scenario: OverrideWithRenameConflict
- **WHEN** `overrideMeetingNote` is called with `rename: true` and a different file already exists with the computed name in the same folder
- **THEN** a notice is shown, no write or rename occurs, and the function returns without modifying any file

#### Scenario: OverrideWithRenameSameFile
- **WHEN** `overrideMeetingNote` is called with `rename: true` and the computed name resolves to the same file (the target file itself)
- **THEN** content is written and no rename is performed (no-op on rename), returning the same TFile
