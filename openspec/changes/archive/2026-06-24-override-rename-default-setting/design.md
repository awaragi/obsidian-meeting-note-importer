## Context

The import modal has an "Override current note" toggle and a secondary "Also rename the note accordingly" toggle. The rename toggle currently always starts as OFF when override is enabled. Users who consistently want both behaviours must flip two toggles on every import. A persisted setting that controls the rename toggle's initial value removes this friction.

## Goals / Non-Goals

**Goals:**
- Add `overrideRenameDefault: boolean` to `IcalMeetingNotesSettings` (default `false`)
- Expose it as a toggle in the settings tab
- Use it to seed the rename toggle's initial value when the override toggle is turned ON in the modal

**Non-Goals:**
- Changing the behaviour when the override toggle is turned OFF (rename still resets to OFF)
- Remembering per-session toggle state across modal opens

## Decisions

**Single boolean field, default false**
A default of `false` preserves existing behaviour for all current users. Users who want rename-by-default explicitly opt in.

**Seeded at override-ON time, not at modal-open time**
The rename toggle is only visible when override is ON. Seeding its value at the moment override is enabled keeps the logic co-located: the `onChange` handler for the override toggle already sets the rename toggle's checked state.

**No separate "reset to default" button**
The setting only controls the initial value. Users can still flip the rename toggle per-import. This keeps the interaction model simple.

## Risks / Trade-offs

- [Minor UX surprise] A user with `overrideRenameDefault: true` who turns override ON will immediately see the label change to "Replacing note". This is intentional — the label already reacts to the rename toggle — but worth confirming the label logic handles the seeded value at initialisation, not just on toggle change. → Mitigation: the label update must fire in the override toggle's `onChange` when seeding the rename value.

## Open Questions

_(none)_
