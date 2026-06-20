## Context

The note filename is currently hardcoded in `noteCreator.ts:98` as `` `${event.date} - ${safeTitle}.md` ``. There is no abstraction — the formula is inlined at the call site.

The existing content template system already uses `{{placeholder}}` substitution (search-and-replace, no engine). The same pattern is reused here for consistency and user familiarity.

Settings already follow a pattern of typed interface (`IcalMeetingNotesSettings`) + defaults object (`DEFAULT_SETTINGS`) + setting tab UI row, so the addition is straightforward.

## Goals / Non-Goals

**Goals:**
- Let users configure the filename via a `{{placeholder}}`-style template string
- Default to current behavior (`{{date}} - {{title}}`) when left empty
- Expose all five `MeetingEvent` fields as variables: `{{date}}`, `{{title}}`, `{{startTime}}`, `{{endTime}}`, `{{organizer}}`
- Display available variables and the date format directly in the settings UI
- Sanitize the resolved name (forbidden chars → `-`) and fall back to `Untitled Meeting` if blank

**Non-Goals:**
- No expression evaluation, conditionals, or loops (plain search-and-replace only)
- No per-folder or per-calendar overrides
- No migration of existing notes

## Decisions

### 1. Reuse `{{placeholder}}` syntax from content templates

**Decision**: Use the same `{{variable}}` delimiters already used in the template file feature.

**Rationale**: Users already see this syntax in their template files. Reusing it requires no new mental model. The implementation is a handful of `String.replace()` calls, consistent with `noteCreator.ts:118`.

**Alternative considered**: A different syntax (e.g. `{variable}` or `[variable]`). Rejected — no benefit and it creates two syntaxes in one plugin.

---

### 2. Sanitize after full substitution, not per-variable

**Decision**: Run `replace(/[\\/:*?"<>|]/g, "-")` on the fully resolved string, not on each variable's value before insertion.

**Rationale**: Sanitizing per-variable would prevent users from using `:` or `/` as structural separators in the template (even though both are forbidden in filenames). Sanitizing the final output is the correct boundary.

---

### 3. Fallback chain: empty template → default → `Untitled Meeting {date}`

**Decision**:
1. If `settings.noteNameTemplate` is empty/whitespace → use `{{date}} - {{title}}`
2. If the resolved + sanitized string is empty or only whitespace → use `Untitled Meeting {event.date}` (the same `YYYY-MM-DD` local-timezone value already computed for `{{date}}`)

**Rationale**: The two-level fallback covers both "user cleared the field" and "all variables resolved to empty strings" (e.g. a template of `{{organizer}}` on an event with no organizer). Including the date in the last-resort fallback ensures the file is still uniquely named per day and matches the date already computed from the event — no second date derivation needed.

---

### 4. Expose all five `MeetingEvent` fields

**Decision**: Expose `{{date}}`, `{{title}}`, `{{startTime}}`, `{{endTime}}`, `{{organizer}}`.

**Rationale**: Implementation cost is identical regardless of how many variables are exposed. `{{startTime}}` is immediately useful for disambiguating back-to-back same-title meetings. Restricting the set provides no benefit.

---

### 5. Show variable reference in settings UI

**Decision**: Render a descriptive text block in the settings tab listing all variables and noting the date format (`YYYY-MM-DD`) and time format (`HH:mm`, local timezone).

**Rationale**: Without this, users must read source code or docs to know what variables exist. An inline reference removes that friction entirely.

## Risks / Trade-offs

- **User sets a template that produces duplicate filenames** → existing behavior (notice + return existing file) handles this; no new risk introduced.
- **User uses `{{startTime}}` and the event has no start time** → resolves to empty string in that position; sanitization and trim handle gracefully. If the whole name is blank, `Untitled Meeting` catches it.
- **i18n strings for variable descriptions** → adding to all three locale files (en, fr, es); French and Spanish descriptions will be author-translated (best effort).
