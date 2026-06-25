## 1. Settings

- [x] 1.1 Add `timeIncrement: 15 | 30 | 60` field to `IcalMeetingNotesSettings` interface and `DEFAULT_SETTINGS` (default `30`) in `settingsTab.ts`
- [x] 1.2 Add dropdown setting for `timeIncrement` in `IcalMeetingNotesSettingTab.display()` with options 15, 30, 60 and i18n keys `settings.time_increment.name` / `settings.time_increment.desc`

## 2. I18n

- [x] 2.1 Add all new keys to `src/ts/i18n/en.json`: `modal.tab_from_file`, `modal.tab_manual`, `modal.manual_title_label`, `modal.manual_title_placeholder`, `modal.manual_date_label`, `modal.manual_start_label`, `modal.manual_end_label`, `modal.manual_create_button`, `settings.time_increment.name`, `settings.time_increment.desc`
- [x] 2.2 Add French translations for all new keys to `src/ts/i18n/fr.json`
- [x] 2.3 Add Spanish translations for all new keys to `src/ts/i18n/es.json`

## 3. Modal Refactor — Tab Structure

- [x] 3.1 Add CSS tab styles to `src/css/styles.css`: `.ical-tabs`, `.ical-tab`, `.ical-tab--active`, `.ical-tab-panel`, `.ical-tab-panel--hidden`
- [x] 3.2 Refactor `IcsDropModal.onOpen()` to render a tab bar (`From File` / `Quick/Manual Entry`) at the top of `contentEl`
- [x] 3.3 Wrap the existing drop-zone markup in a `From File` panel div; move save-to label and override/rename controls outside both panels into a shared section below

## 4. Manual Entry Form

- [x] 4.1 Implement `buildManualPanel(container: HTMLElement)` method on `IcsDropModal` that renders: title `<input type="text">`, date `<input type="date">` (default today), start `<input type="time">` with `step` set to increment-in-seconds (default = nearest-increment of now), end `<input type="time">` with same `step` (default = start + increment), and a Create button
- [x] 4.2 Implement `roundToNearestIncrement(date: Date, incrementMinutes: number): string` helper that returns `HH:MM` — uses `Math.round(totalMinutes / increment) * increment`
- [x] 4.3 Implement the Create button handler: read field values, construct a `MeetingEvent` (title fallback to localised "Untitled", organizer/attendees/description/location/meetingUrl all empty), call `this.close()` then `plugin.processEvent(event, opts)`

## 5. Tab Switching

- [x] 5.1 Implement tab click handler: toggles `.ical-tab--active` on the clicked tab, shows/hides the corresponding panel divs using `.ical-tab-panel--hidden`

## 6. Verification

- [x] 6.1 Build (`npm run build`) with no TypeScript errors
- [x] 6.2 Deploy and manually verify: From File tab works as before; Quick/Manual Entry tab opens with correct defaults; Shift+↑↓ on time fields jumps by increment; Create button produces a note; override/rename controls work from both tabs
- [x] 6.3 Verify 12/24 hr display follows system locale by testing with en-US (12 hr) and en-GB or fr (24 hr) locale settings
