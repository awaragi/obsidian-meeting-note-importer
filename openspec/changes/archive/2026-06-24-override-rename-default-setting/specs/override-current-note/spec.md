## MODIFIED Requirements

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
