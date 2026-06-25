## ADDED Requirements

### Requirement: NewCommandAndRibbonStrings
The system SHALL add the following keys to all three locale files (en.json, fr.json, es.json):

| Key | EN value |
|-----|----------|
| `command.quick_name` | `New quick meeting note` |
| `settings.show_ribbon.name` | `Show ribbon icon` |
| `settings.show_ribbon.desc` | `Display the calendar icon in the ribbon bar. Takes effect after reloading Obsidian.` |

#### Scenario: NewKeysDefinedInEnglish
- **WHEN** the plugin loads with the EN locale
- **THEN** `command.quick_name`, `settings.show_ribbon.name`, and `settings.show_ribbon.desc` each resolve to a non-empty string

### Requirement: ExistingCommandKeyUpdated
The value of the existing key `command.name` SHALL be updated in all three locale files to reflect the renamed command.

| Key | Updated EN value |
|-----|-----------------|
| `command.name` | `Open meeting note importer` |

#### Scenario: AllNewKeysDefinedInAllLocales
- **WHEN** the plugin loads with locale set to fr or es
- **THEN** all new keys resolve to a non-empty string

#### Scenario: UpdatedCommandNameShownInHotkeys
- **WHEN** the user opens Obsidian Settings → Hotkeys
- **THEN** the existing command displays "Open meeting note importer" in the active locale
