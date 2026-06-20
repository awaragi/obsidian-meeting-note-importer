# Note Name Template Specification

## Purpose

Controls how the filename of a newly created meeting note is derived from the meeting event data. The filename is produced by resolving a user-configurable `{{placeholder}}` template against the fields of the parsed `MeetingEvent`, applying filename sanitization, and appending the `.md` extension.

## Requirements

### Requirement: Configurable note filename template
The plugin SHALL resolve the meeting note filename from a user-configurable template string using `{{placeholder}}` variable substitution. The `.md` extension SHALL be appended automatically and SHALL NOT be part of the template.

Supported variables:
- `{{date}}` — event date formatted as `YYYY-MM-DD` (local timezone)
- `{{title}}` — event summary/subject
- `{{startTime}}` — event start time formatted as `HH:mm` (local timezone, 24h)
- `{{endTime}}` — event end time formatted as `HH:mm` (local timezone, 24h)
- `{{organizer}}` — organizer display name or email; empty string if not present

#### Scenario: Template with date and title variables
- **WHEN** the template is `{{date}} - {{title}}` and the event has date `2026-06-20` and title `Q2 Planning`
- **THEN** the resolved filename is `2026-06-20 - Q2 Planning.md`

#### Scenario: Template includes startTime to disambiguate meetings
- **WHEN** the template is `{{date}} {{startTime}} - {{title}}` and the event starts at `14:30`
- **THEN** the resolved filename is `2026-06-20 14:30 - Q2 Planning.md`

#### Scenario: Organizer variable resolves to empty when absent
- **WHEN** the template is `{{organizer}} - {{title}}` and the event has no organizer
- **THEN** the resolved filename is ` - Q2 Planning.md` before sanitization, which after trim becomes `- Q2 Planning.md`

### Requirement: Filename sanitization
After variable substitution, the plugin SHALL replace all characters forbidden in filenames (`\ / : * ? " < > |`) with `-`. The result SHALL be trimmed of leading and trailing whitespace.

#### Scenario: Title contains forbidden characters
- **WHEN** the event title is `Q2: Review & Plan` and the template is `{{date}} - {{title}}`
- **THEN** the resolved filename is `2026-06-20 - Q2- Review & Plan.md`

#### Scenario: Colons from template structure are also sanitized
- **WHEN** the template is `{{date}}: {{title}}` and the event has title `Planning`
- **THEN** the resolved filename is `2026-06-20- Planning.md`

### Requirement: Empty template falls back to default
When `noteNameTemplate` is empty or whitespace, the plugin SHALL behave as if the template were `{{date}} - {{title}}`.

#### Scenario: User leaves template blank
- **WHEN** `noteNameTemplate` is an empty string
- **THEN** the filename is computed as `{date} - {title}.md` (current behavior)

#### Scenario: User sets template to only whitespace
- **WHEN** `noteNameTemplate` is `   `
- **THEN** the filename is computed as `{date} - {title}.md`

### Requirement: Blank resolved name falls back to Untitled Meeting with date
If the resolved and sanitized filename is empty or blank, the plugin SHALL use `Untitled Meeting {date}` as the filename, where `{date}` is `event.date` (the same `YYYY-MM-DD` local-timezone value used by the `{{date}}` variable).

#### Scenario: All variables resolve to empty
- **WHEN** the template is `{{organizer}}` and the event has no organizer and the event date is `2026-06-20`
- **THEN** the filename is `Untitled Meeting 2026-06-20.md`
