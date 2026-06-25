## ADDED Requirements

### Requirement: QuickManualEntryStrings
The system SHALL add the following new translation keys to all three locale files (en.json, fr.json, es.json). Keys SHALL follow the existing dot-notation naming convention.

New keys required:

| Key | EN value |
|-----|----------|
| `modal.tab_from_file` | `From File` |
| `modal.tab_manual` | `Quick/Manual Entry` |
| `modal.manual_title_label` | `Title` |
| `modal.manual_title_placeholder` | `Untitled` |
| `modal.manual_date_label` | `Date` |
| `modal.manual_start_label` | `Start` |
| `modal.manual_end_label` | `End` |
| `modal.manual_create_button` | `Create` |
| `settings.time_increment.name` | `Time increment` |
| `settings.time_increment.desc` | `Default duration for manual meeting entries and time rounding` |

#### Scenario: AllKeysDefinedInAllLocales
- **WHEN** the plugin loads with locale set to fr or es
- **THEN** all new keys resolve to a non-empty string (no fallback to key name)

#### Scenario: ManualTabLabelLocalised
- **WHEN** the modal opens in French locale
- **THEN** the "Quick/Manual Entry" tab renders the French translation of `modal.tab_manual`

#### Scenario: UntitledPlaceholderLocalised
- **WHEN** the manual entry tab is open in Spanish locale
- **THEN** the title input placeholder text is the Spanish translation of `modal.manual_title_placeholder`
