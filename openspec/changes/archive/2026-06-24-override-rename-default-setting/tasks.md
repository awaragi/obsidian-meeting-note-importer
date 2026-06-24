## 1. Settings Model

- [x] 1.1 Add `overrideRenameDefault: boolean` to the `IcalMeetingNotesSettings` interface in `settingsTab.ts`
- [x] 1.2 Add `overrideRenameDefault: false` to `DEFAULT_SETTINGS` in `settingsTab.ts`
- [x] 1.3 Add i18n keys `settings.override_rename_default.name` and `settings.override_rename_default.desc` to `en.json`, `fr.json`, and `es.json`

## 2. Settings UI

- [x] 2.1 Add a toggle setting for `overrideRenameDefault` in `IcalMeetingNotesSettingTab.display()` using the new i18n keys

## 3. Modal — Seed Rename Toggle from Setting

- [x] 3.1 Pass `settings` (or just `overrideRenameDefault`) into `IcsDropModal` if not already available
- [x] 3.2 In the override toggle's `onChange`, seed the rename toggle's initial value from `settings.overrideRenameDefault` instead of hardcoded `false`
- [x] 3.3 Update the override label text at seed time (if `overrideRenameDefault` is true, show "Replacing note" label immediately when override is enabled)
- [x] 3.4 Ensure the rename toggle and label reset to OFF / "Replacing content of" when the override toggle is turned OFF (existing behaviour, verify unchanged)
