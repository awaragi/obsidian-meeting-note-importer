## ADDED Requirements

### Requirement: ShowRibbonIconSetting
The system SHALL add a `showRibbonIcon` boolean field to `IcalMeetingNotesSettings` with a default value of `true`. The settings UI SHALL render a toggle for this field with localised name and description. The ribbon icon SHALL only be registered during `onload()` when `showRibbonIcon` is `true`. Changing the setting takes effect after Obsidian reloads the plugin.

#### Scenario: DefaultIsTrue
- **WHEN** no stored value exists for `showRibbonIcon` (first install or missing key)
- **THEN** the field resolves to `true` via `DEFAULT_SETTINGS` merge and the ribbon icon is shown

#### Scenario: RibbonHiddenWhenFalse
- **WHEN** `showRibbonIcon` is `false` and the plugin loads
- **THEN** `addRibbonIcon` is not called and no ribbon icon appears

#### Scenario: RibbonShownWhenTrue
- **WHEN** `showRibbonIcon` is `true` and the plugin loads
- **THEN** `addRibbonIcon` is called and the calendar-plus ribbon icon is visible

#### Scenario: ToggleRenderedAtTopOfSettingsTab
- **WHEN** the settings tab is opened
- **THEN** a toggle labelled with i18n key `settings.show_ribbon.name` is the first control rendered, immediately after the section heading
