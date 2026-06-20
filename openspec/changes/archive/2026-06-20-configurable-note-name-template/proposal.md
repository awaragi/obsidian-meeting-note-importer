## Why

The note filename is hardcoded as `{date} - {title}.md`, giving users no control over naming conventions. Users with different folder structures, date preferences, or naming standards cannot adapt the plugin to their workflow.

## What Changes

- Add a `noteNameTemplate` setting (string) to `IcalMeetingNotesSettings`
- Default value: `{{date}} - {{title}}` (matches current hardcoded behavior)
- Template supports `{{date}}`, `{{title}}`, `{{startTime}}`, `{{endTime}}`, `{{organizer}}` variables using the same `{{placeholder}}` syntax as content templates
- Empty setting falls back to the default template (placeholder text in the UI shows the default)
- Settings page displays the available variables and date format so users understand what to enter
- Forbidden filename characters (`\ / : * ? " < > |`) are sanitized to `-` after variable substitution
- If the resolved filename is blank after sanitization, fall back to `Untitled Meeting {date}` (using the event's already-computed date)

## Capabilities

### New Capabilities

- `note-name-template`: Configurable filename template with variable substitution for meeting note files

### Modified Capabilities

- `settings`: New `noteNameTemplate` field added to settings interface and settings UI

## Impact

- `src/ts/settingsTab.ts`: new field in `IcalMeetingNotesSettings`, new `DEFAULT_SETTINGS` entry, new setting row in UI with variable reference block
- `src/ts/noteCreator.ts`: replace hardcoded filename line with `resolveNoteName()` helper
- `src/ts/i18n/en.json` (+ `fr.json`, `es.json`): 3–4 new i18n keys for the setting label, description, placeholder, and variable reference text
- No dependency changes, no breaking changes to existing notes or settings (empty field degrades gracefully to current behavior)
