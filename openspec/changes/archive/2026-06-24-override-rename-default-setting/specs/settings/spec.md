## ADDED Requirements

### Requirement: OverrideRenameDefaultSetting
The system SHALL include an `overrideRenameDefault` boolean field in `IcalMeetingNotesSettings`, defaulting to `false`. The settings UI SHALL render a toggle for this field with a localised name and description. When `true`, the "Also rename the note accordingly" toggle in the import modal initialises to ON whenever the override toggle is enabled.

#### Scenario: DefaultValueIsFalse
- **WHEN** no stored value exists for `overrideRenameDefault` (first install or missing key)
- **THEN** the field resolves to `false` via `DEFAULT_SETTINGS` merge

#### Scenario: SettingPersistedAndRestored
- **WHEN** the user enables the toggle in settings and reloads Obsidian
- **THEN** `overrideRenameDefault` is `true` on the next plugin load

#### Scenario: ToggleRenderedInSettingsTab
- **WHEN** the settings tab is opened
- **THEN** a toggle labelled with the i18n key `settings.override_rename_default.name` is visible, with description `settings.override_rename_default.desc`
