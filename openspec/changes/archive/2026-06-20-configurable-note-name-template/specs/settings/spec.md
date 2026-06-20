## ADDED Requirements

### Requirement: Note name template setting field
The settings interface SHALL include a `noteNameTemplate` string field. The settings UI SHALL render a text input for this field with:
- Label and description (i18n)
- Placeholder text showing the default template (`{{date}} - {{title}}`) so users understand what an empty value means
- A read-only reference block listing all supported variables and their formats immediately below the input

#### Scenario: Setting persists across plugin reloads
- **WHEN** the user enters `{{date}} {{startTime}} - {{title}}` and saves
- **THEN** on next plugin load the field value is `{{date}} {{startTime}} - {{title}}`

#### Scenario: Empty value shows placeholder
- **WHEN** `noteNameTemplate` is `""` (default)
- **THEN** the text input shows the placeholder `{{date}} - {{title}}` (greyed out, not saved as a value)

### Requirement: Variable reference displayed in settings
The settings UI SHALL display a descriptive block beneath the note name template input that lists all available `{{placeholder}}` variables, their meaning, and the format of date and time values.

The block SHALL include:
- `{{date}}` — date in `YYYY-MM-DD` format (local timezone)
- `{{title}}` — meeting title
- `{{startTime}}` — start time in `HH:mm` 24-hour format (local timezone)
- `{{endTime}}` — end time in `HH:mm` 24-hour format (local timezone)
- `{{organizer}}` — organizer name or email (empty if not present)

#### Scenario: Reference block is always visible
- **WHEN** the settings tab is open
- **THEN** the variable reference block is visible below the note name template input regardless of the current field value
