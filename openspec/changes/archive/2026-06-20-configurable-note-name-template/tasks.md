## 1. Settings Interface

- [x] 1.1 Add `noteNameTemplate: string` field to `IcalMeetingNotesSettings` in `settingsTab.ts`
- [x] 1.2 Add `noteNameTemplate: ""` to `DEFAULT_SETTINGS` in `settingsTab.ts`

## 2. i18n Strings

- [x] 2.1 Add `settings.note_name_template.name`, `settings.note_name_template.desc`, `settings.note_name_template.placeholder`, and `settings.note_name_template.variables` keys to `i18n/en.json`
- [x] 2.2 Add the same keys to `i18n/fr.json` with French translations
- [x] 2.3 Add the same keys to `i18n/es.json` with Spanish translations

## 3. Settings UI

- [x] 3.1 Add a new `Setting` row in `IcalMeetingNotesSettingTab.display()` for the note name template text input (label, description, placeholder showing default, onChange saving to `noteNameTemplate`)
- [x] 3.2 Render a read-only variable reference block beneath the input listing all five variables (`{{date}}`, `{{title}}`, `{{startTime}}`, `{{endTime}}`, `{{organizer}}`) with their formats and descriptions

## 4. Core Logic

- [x] 4.1 Add `DEFAULT_NOTE_NAME_TEMPLATE = "{{date}} - {{title}}"` constant to `noteCreator.ts`
- [x] 4.2 Implement `resolveNoteName(template: string, event: MeetingEvent): string` in `noteCreator.ts` — substitutes all five variables, sanitizes forbidden chars, falls back to `Untitled Meeting {event.date}` if blank
- [x] 4.3 Replace the hardcoded `fileName` line in `createMeetingNote` with a call to `resolveNoteName(settings.noteNameTemplate, event)`

## 5. Tests

- [x] 5.1 Add unit tests for `resolveNoteName` in `noteCreator.spec.ts` covering: custom template, empty template fallback, blank-result fallback to `Untitled Meeting {date}`, forbidden char sanitization, and missing variable (e.g. empty organizer)
