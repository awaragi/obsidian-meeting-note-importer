# quick-entry-command Specification

## Purpose
TBD - created by archiving change update-commands-and-ribbon. Update Purpose after archive.
## Requirements
### Requirement: QuickEntryCommand
The plugin SHALL register a second command with ID `new-quick-meeting-note` and localised name from key `command.quick_name`. When invoked, it SHALL open `IcsDropModal` with `initialTab` set to `"manual"`, causing the Quick/Manual Entry tab to be active and the title input focused on open.

#### Scenario: CommandOpensManualTab
- **WHEN** the user invokes the "New quick meeting note" command
- **THEN** the modal opens with the Quick/Manual Entry tab active and the title input focused

#### Scenario: CommandAvailableInHotkeySettings
- **WHEN** the user opens Obsidian Settings → Hotkeys
- **THEN** "New quick meeting note" appears as an assignable command for this plugin

### Requirement: ExistingCommandRenamed
The existing command with ID `import-ics-meeting-note` SHALL have its displayed name updated to the value of i18n key `command.name` (updated value: "Open meeting note importer"). The command ID SHALL remain unchanged to preserve any existing user hotkey assignments.

#### Scenario: ExistingHotkeyPreserved
- **WHEN** a user had a hotkey assigned to `import-ics-meeting-note` before the update
- **THEN** the hotkey continues to function after the update because the command ID is unchanged

#### Scenario: RenamedCommandOpensFileTab
- **WHEN** the user invokes the renamed "Open meeting note importer" command
- **THEN** the modal opens on the From File tab (existing behaviour, unchanged)

### Requirement: InitialTabParameter
`IcsDropModal` SHALL accept an optional `initialTab: "file" | "manual"` constructor parameter defaulting to `"file"`. When `"manual"` is passed, the modal SHALL activate the Quick/Manual Entry tab and focus the title input during `onOpen()`.

#### Scenario: DefaultIsFileTab
- **WHEN** `IcsDropModal` is constructed without an `initialTab` argument
- **THEN** the From File tab is active on open

#### Scenario: ManualTabActivatedWhenRequested
- **WHEN** `IcsDropModal` is constructed with `initialTab: "manual"`
- **THEN** the Quick/Manual Entry tab is active and the title input is focused on open

