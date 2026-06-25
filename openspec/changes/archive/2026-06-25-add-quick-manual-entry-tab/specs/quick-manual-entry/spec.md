## ADDED Requirements

### Requirement: TabStructure
The modal SHALL be restructured into two tabs: "From File" and "Quick/Manual Entry". The shared section (save-to label, override toggle, rename toggle) SHALL be rendered outside and below both tab panels and SHALL apply equally to both tabs.

#### Scenario: FromFileTabIsDefault
- **WHEN** the modal is opened
- **THEN** the "From File" tab is active and the ICS drop zone is visible

#### Scenario: SwitchingToManualTab
- **WHEN** the user clicks the "Quick/Manual Entry" tab
- **THEN** the manual entry form is shown and the drop zone is hidden

#### Scenario: SwitchingBackToFileTab
- **WHEN** the user switches to "Quick/Manual Entry" then back to "From File"
- **THEN** the drop zone is visible and the manual form is hidden

#### Scenario: SharedControlsAlwaysVisible
- **WHEN** either tab is active
- **THEN** the save-to label, override toggle, and rename toggle are visible below the tab panel

### Requirement: ManualEntryForm
The "Quick/Manual Entry" tab SHALL render a form with: a title text input, a native date input (`<input type="date">`), a native start time input (`<input type="time">`), and a native end time input (`<input type="time">`). A "Create" button SHALL submit the form.

#### Scenario: FormRendersWithDefaults
- **WHEN** the "Quick/Manual Entry" tab is opened
- **THEN** the title field is empty, the date field shows today's date, the start time shows the current time rounded to the nearest increment, and the end time shows start time plus the increment

#### Scenario: TitlePlaceholder
- **WHEN** the title field is empty
- **THEN** the field shows a localised placeholder (e.g. "Untitled")

#### Scenario: CreateButtonSubmitsForm
- **WHEN** the user clicks "Create" (or presses Enter in the form)
- **THEN** a MeetingEvent is constructed from the field values and passed to processEvent()

#### Scenario: EmptyTitleUsesLocalizedUntitled
- **WHEN** the title field is empty and the user submits
- **THEN** the MeetingEvent title is set to the localised "Untitled" string

### Requirement: DateInput
The date field SHALL use a native `<input type="date">` element. The field SHALL default to today's date in YYYY-MM-DD format (the value format required by the input type). The native calendar popup SHALL be left intact — it is dismissed with Escape and provides useful date picking for dates not near today.

#### Scenario: DefaultsToToday
- **WHEN** the manual entry tab is opened
- **THEN** the date input value equals today's date in YYYY-MM-DD format

#### Scenario: UpDownKeyboardNavigation
- **WHEN** the user presses ↑ or ↓ on the date input with the calendar popup closed
- **THEN** the date changes by one day (native browser segment-aware behaviour)

### Requirement: TimeInput
Both start and end time fields SHALL use native `<input type="time">` elements. The `step` attribute SHALL be set to the time increment in seconds (e.g. 900 for 15 min, 1800 for 30 min, 3600 for 60 min). The browser SHALL handle 12/24 hour display based on system locale automatically. The `step` attribute drives native ↑↓ snapping on the minute segment — no custom keyboard handler is required.

#### Scenario: StartTimeDefaultsToNearestIncrement
- **WHEN** the manual entry tab is opened
- **THEN** the start time value equals the current time rounded to the nearest increment boundary (Math.round(totalMinutes / increment) * increment)

#### Scenario: EndTimeDefaultsToStartPlusIncrement
- **WHEN** the manual entry tab is opened
- **THEN** the end time value equals start time plus the increment

#### Scenario: NativeSegmentNavigation
- **WHEN** the user presses ↑ or ↓ on the time input with cursor in the hour segment
- **THEN** hours change by one (native Chromium behaviour)

#### Scenario: MinuteSegmentSnapsToIncrement
- **WHEN** the user presses ↑ or ↓ on the time input with cursor in the minute segment
- **THEN** minutes change by the configured increment (e.g. ±30 min for a 30-min increment), driven by the `step` attribute

#### Scenario: EndTimeEditableIndependently
- **WHEN** the user manually changes the end time after the tab opens
- **THEN** the end time retains the user's value and is not re-calculated from start time

### Requirement: ManualMeetingEventConstruction
When the manual entry form is submitted, the system SHALL construct a MeetingEvent with: title from the title field (or localised "Untitled" if empty), date from the date field, startTime from the start time field (HH:mm, 24-hour), endTime from the end time field (HH:mm, 24-hour), and all other fields (organizer, attendees, description, location, meetingUrl) set to empty string / empty array.

#### Scenario: AllFieldsMappedCorrectly
- **WHEN** the user enters "Team Sync", date 2026-06-24, start 14:00, end 14:30 and submits
- **THEN** processEvent receives a MeetingEvent with title "Team Sync", date "2026-06-24", startTime "14:00", endTime "14:30", organizer "", attendees [], description "", location "", meetingUrl ""

#### Scenario: EmptyTitleFallback
- **WHEN** the title field is empty and the user submits
- **THEN** the MeetingEvent title equals the localised "Untitled" string (e.g. "Untitled" in English)
