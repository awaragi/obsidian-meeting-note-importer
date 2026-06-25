## ADDED Requirements

### Requirement: TimeIncrementSetting
The system SHALL add a `timeIncrement` field to `IcalMeetingNotesSettings` with type `15 | 30 | 60` (minutes) and a default value of `30`. The settings UI SHALL render a dropdown for this field with options 15, 30, and 60 minutes, with localised label and description.

#### Scenario: DefaultValueIsThirtyMinutes
- **WHEN** no stored value exists for `timeIncrement` (first install or missing key)
- **THEN** the field resolves to `30` via `DEFAULT_SETTINGS` merge

#### Scenario: SettingPersistedAndRestored
- **WHEN** the user selects 15 minutes in settings and reloads Obsidian
- **THEN** `timeIncrement` is `15` on the next plugin load

#### Scenario: DropdownRenderedInSettingsTab
- **WHEN** the settings tab is opened
- **THEN** a dropdown labelled with the i18n key `settings.time_increment.name` is visible with options 15, 30, and 60

#### Scenario: IncrementDrivesStartTimeRounding
- **WHEN** `timeIncrement` is `15` and the current time is 10:22
- **THEN** the manual entry start time defaults to 10:30 (nearest 15-minute boundary)

#### Scenario: IncrementDrivesEndTimeDefault
- **WHEN** `timeIncrement` is `30` and start time is 10:00
- **THEN** end time defaults to 10:30
