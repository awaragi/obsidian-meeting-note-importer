## Context

The plugin now has two modal entry points (ICS import and quick manual entry) but only one command and one ribbon icon. The `IcsDropModal` constructor currently has no way to control which tab opens first. The ribbon icon is always registered with no way to suppress it.

## Goals / Non-Goals

**Goals:**
- Rename existing command label to reflect the broader modal capability
- Add a second command that opens the modal on the Quick/Manual Entry tab with title focused
- Add `showRibbonIcon` setting that suppresses ribbon registration when false
- Pass an `initialTab` parameter to `IcsDropModal` to control starting tab

**Non-Goals:**
- Changing hotkey defaults (users assign those in Obsidian Settings → Hotkeys)
- Live ribbon toggle without reload (standard Obsidian plugin pattern requires reload)
- Multiple ribbon icons

## Decisions

### D1: `initialTab` parameter on `IcsDropModal` constructor

Add an optional `initialTab: "file" | "manual"` parameter (default `"file"`). In `onOpen()`, when `initialTab === "manual"`, activate the manual tab panel and focus the title input immediately. This keeps all tab logic inside the modal and requires no changes to `processEvent` or `noteCreator`.

**Alternative**: A separate `IcsQuickModal` subclass. Rejected — duplicates modal logic for a trivial difference.

### D2: Ribbon registered conditionally in `onload()`

```typescript
if (this.settings.showRibbonIcon) {
  this.addRibbonIcon("calendar-plus", t("ribbon.tooltip"), () => this.openDropModal());
}
```

Ribbon registration happens once at plugin load. Changing the setting requires a reload — this is the standard Obsidian plugin pattern and does not need a notice to the user beyond what the settings description says.

**Alternative**: Dynamically add/remove the ribbon icon on setting change via the returned element. Possible but adds complexity; the reload model is universally understood by Obsidian users.

### D3: Existing command ID unchanged

The command ID `import-ics-meeting-note` is kept as-is. Only the displayed `name` label changes. This avoids breaking any user hotkey assignments that reference the ID.

## Risks / Trade-offs

- **Ribbon setting requires reload** → Documented in the setting description. No functional risk.
- **`initialTab` default is `"file"`** → Existing `openDropModal()` call sites need no changes.

## Migration Plan

No data migration. `showRibbonIcon` is a new field with `true` as default — existing users keep the ribbon on first load after update.

## Open Questions

None.
