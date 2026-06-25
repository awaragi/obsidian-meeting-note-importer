## 1. Settings

- [x] 1.1 Add `showRibbonIcon: boolean` field to `IcalMeetingNotesSettings` interface and `DEFAULT_SETTINGS` (default `true`) in `settingsTab.ts`
- [x] 1.2 Add toggle for `showRibbonIcon` as the **first setting** in `IcalMeetingNotesSettingTab.display()`, immediately after the heading, using i18n keys `settings.show_ribbon.name` / `settings.show_ribbon.desc`

## 2. I18n

- [x] 2.1 Update `command.name` value in `en.json` to `"Open meeting note importer"`; add `command.quick_name`, `settings.show_ribbon.name`, `settings.show_ribbon.desc`
- [x] 2.2 Update `command.name` and add the three new keys in `fr.json`
- [x] 2.3 Update `command.name` and add the three new keys in `es.json`

## 3. Modal — initialTab parameter

- [x] 3.1 Add optional `initialTab: "file" | "manual"` parameter to `IcsDropModal` constructor (default `"file"`)
- [x] 3.2 In `onOpen()`, after building both panels and wiring tab switching, if `initialTab === "manual"` activate the manual tab (add/remove active class, show/hide panels) and call `manualTitleInput.focus()`

## 4. Plugin — commands and ribbon

- [x] 4.1 Wrap the `addRibbonIcon` call in `onload()` with `if (this.settings.showRibbonIcon)`
- [x] 4.2 Update the existing command `name` to `t("command.name")` (value now "Open meeting note importer")
- [x] 4.3 Add new command `new-quick-meeting-note` with `name: t("command.quick_name")` that calls `openDropModal("manual")`
- [x] 4.4 Update `openDropModal()` to accept an optional `initialTab: "file" | "manual"` parameter and pass it through to `IcsDropModal`

## 5. Verification

- [x] 5.1 Build (`npm run build`) with no TypeScript errors
- [x] 5.2 Deploy and verify: both commands appear in Obsidian command palette; quick command opens on manual tab with title focused; ribbon toggle hides/shows icon after reload
