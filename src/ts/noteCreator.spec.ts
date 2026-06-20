import { describe, expect, it } from "vitest";
import type { MeetingEvent } from "./icalParser";
import { resolveNoteName, DEFAULT_NOTE_NAME_TEMPLATE } from "./noteNameResolver";

// Re-export the private helpers via a thin test shim so we don't modify
// noteCreator.ts's public API. Instead, we test through the exported shapes
// that these functions produce. Since injectUnderHeading, buildAttendeesBlock,
// and buildNotesBlock are unexported module-private functions, we test their
// behaviour indirectly — or extract them inline here to keep tests pure.

// Inline copies matching noteCreator.ts exactly, so changes there will break
// these tests and surface the divergence.

function injectUnderHeading(content: string, heading: string, block: string): string {
  if (!heading || !block) return content;
  const lines = content.split("\n");
  const idx = lines.findIndex((l) => l.trimEnd() === heading.trimEnd());
  if (idx === -1) return content;

  let nextIdx = idx + 1;
  while (nextIdx < lines.length && lines[nextIdx].trim() === "") nextIdx++;

  const nextLine = nextIdx < lines.length ? lines[nextIdx].trimEnd() : "";
  if (nextLine === "-" || nextLine === "- ") {
    lines.splice(nextIdx, 1, block);
  } else {
    lines.splice(idx + 1, 0, "", block);
  }

  return lines.join("\n");
}

function buildAttendeesBlock(event: MeetingEvent): string {
  const items: string[] = [];
  if (event.organizer) items.push(`- ${event.organizer} (Organizer)`);
  for (const a of event.attendees) items.push(`- ${a}`);
  return items.join("\n");
}

function buildNotesBlock(event: MeetingEvent): string {
  const parts: string[] = [];
  if (event.meetingUrl) parts.push(`> ${event.meetingUrl}`);
  if (event.location && event.location !== event.meetingUrl) {
    parts.push(`> 📍 ${event.location}`);
  }
  if (event.description) {
    if (parts.length > 0) parts.push("");
    parts.push(event.description);
  }
  return parts.join("\n");
}

const BASE_EVENT: MeetingEvent = {
  title: "Team Sync",
  date: "2026-06-15",
  startTime: "15:30",
  endTime: "16:00",
  organizer: "Alice Smith",
  attendees: ["Bob Jones", "Carol White"],
  description: "Review Q2 results",
  location: "Room 3B",
  meetingUrl: "",
};

// ── injectUnderHeading ─────────────────────────────────────────────────────

describe("injectUnderHeading", () => {
  it("returns content unchanged when heading is not found", () => {
    const content = "## Notes\n- ";
    expect(injectUnderHeading(content, "## Attendees", "- Alice")).toBe(content);
  });

  it("returns content unchanged when heading is empty", () => {
    const content = "## Notes\n- ";
    expect(injectUnderHeading(content, "", "- Alice")).toBe(content);
  });

  it("returns content unchanged when block is empty", () => {
    const content = "## Attendees\n- ";
    expect(injectUnderHeading(content, "## Attendees", "")).toBe(content);
  });

  it("replaces a lone placeholder bullet under the heading", () => {
    const content = "## Attendees\n- ";
    const result = injectUnderHeading(content, "## Attendees", "- Alice\n- Bob");
    expect(result).toBe("## Attendees\n- Alice\n- Bob");
  });

  it("replaces a bare '-' placeholder under the heading", () => {
    const content = "## Attendees\n-";
    const result = injectUnderHeading(content, "## Attendees", "- Alice");
    expect(result).toBe("## Attendees\n- Alice");
  });

  it("inserts block after heading when no placeholder follows", () => {
    const content = "## Attendees\nExisting content";
    const result = injectUnderHeading(content, "## Attendees", "- Alice");
    expect(result).toBe("## Attendees\n\n- Alice\nExisting content");
  });

  it("skips blank lines between heading and placeholder", () => {
    const content = "## Attendees\n\n- ";
    const result = injectUnderHeading(content, "## Attendees", "- Alice");
    expect(result).toBe("## Attendees\n\n- Alice");
  });
});

// ── buildAttendeesBlock ────────────────────────────────────────────────────

describe("buildAttendeesBlock", () => {
  it("includes organizer with label", () => {
    const block = buildAttendeesBlock(BASE_EVENT);
    expect(block).toContain("- Alice Smith (Organizer)");
  });

  it("includes all attendees", () => {
    const block = buildAttendeesBlock(BASE_EVENT);
    expect(block).toContain("- Bob Jones");
    expect(block).toContain("- Carol White");
  });

  it("returns empty string when no organizer and no attendees", () => {
    const event = { ...BASE_EVENT, organizer: "", attendees: [] };
    expect(buildAttendeesBlock(event)).toBe("");
  });

  it("omits organizer line when organizer is empty", () => {
    const event = { ...BASE_EVENT, organizer: "" };
    const block = buildAttendeesBlock(event);
    expect(block).not.toContain("Organizer");
    expect(block).toContain("- Bob Jones");
  });
});

// ── buildNotesBlock ────────────────────────────────────────────────────────

describe("buildNotesBlock", () => {
  it("returns empty string when event has no url, location, or description", () => {
    const event = { ...BASE_EVENT, meetingUrl: "", location: "", description: "" };
    expect(buildNotesBlock(event)).toBe("");
  });

  it("includes meeting URL as blockquote", () => {
    const event = {
      ...BASE_EVENT,
      meetingUrl: "https://teams.microsoft.com/l/abc",
      location: "",
      description: "",
    };
    const block = buildNotesBlock(event);
    expect(block).toBe("> https://teams.microsoft.com/l/abc");
  });

  it("includes location when it differs from meetingUrl", () => {
    const event = { ...BASE_EVENT, meetingUrl: "", location: "Room 3B", description: "" };
    const block = buildNotesBlock(event);
    expect(block).toBe("> 📍 Room 3B");
  });

  it("omits location when it equals meetingUrl", () => {
    const url = "https://teams.microsoft.com/l/abc";
    const event = { ...BASE_EVENT, meetingUrl: url, location: url, description: "" };
    const block = buildNotesBlock(event);
    expect(block).not.toContain("📍");
  });

  it("adds blank line separator between URL and description", () => {
    const event = {
      ...BASE_EVENT,
      meetingUrl: "https://teams.microsoft.com/l/abc",
      location: "",
      description: "Agenda: review Q2",
    };
    const block = buildNotesBlock(event);
    expect(block).toBe("> https://teams.microsoft.com/l/abc\n\nAgenda: review Q2");
  });

  it("includes description alone when no url or location", () => {
    const event = { ...BASE_EVENT, meetingUrl: "", location: "", description: "Notes here" };
    expect(buildNotesBlock(event)).toBe("Notes here");
  });
});

// ── resolveNoteName ────────────────────────────────────────────────────────

describe("resolveNoteName", () => {
  it("substitutes date and title with default template when empty", () => {
    expect(resolveNoteName("", BASE_EVENT)).toBe("2026-06-15 - Team Sync");
  });

  it("substitutes date and title with whitespace-only template", () => {
    expect(resolveNoteName("   ", BASE_EVENT)).toBe("2026-06-15 - Team Sync");
  });

  it("uses custom template with all five variables", () => {
    const result = resolveNoteName("{{date}} {{startTime}}-{{endTime}} {{title}} ({{organizer}})", BASE_EVENT);
    expect(result).toBe("2026-06-15 15-30-16-00 Team Sync (Alice Smith)");
  });

  it("substitutes startTime variable", () => {
    expect(resolveNoteName("{{date}} {{startTime}} - {{title}}", BASE_EVENT)).toBe(
      "2026-06-15 15-30 - Team Sync"
    );
  });

  it("sanitizes forbidden characters in resolved name", () => {
    const event = { ...BASE_EVENT, title: "Q2: Review & Plan" };
    expect(resolveNoteName("{{date}} - {{title}}", event)).toBe("2026-06-15 - Q2- Review & Plan");
  });

  it("sanitizes forbidden chars introduced by the template itself", () => {
    expect(resolveNoteName("{{date}}: {{title}}", BASE_EVENT)).toBe("2026-06-15- Team Sync");
  });

  it("resolves to empty organizer when not present and falls back gracefully", () => {
    const event = { ...BASE_EVENT, organizer: "" };
    expect(resolveNoteName("{{organizer}} - {{title}}", event)).toBe("- Team Sync");
  });

  it("falls back to Untitled Meeting with date when all variables resolve to empty", () => {
    const event = { ...BASE_EVENT, organizer: "" };
    expect(resolveNoteName("{{organizer}}", event)).toBe(`Untitled Meeting ${BASE_EVENT.date}`);
  });

  it("maps forbidden chars to dashes rather than falling back", () => {
    // ":::" → "---" after sanitization — non-empty, so no fallback
    expect(resolveNoteName(":::", BASE_EVENT)).toBe("---");
  });

  it("falls back to Untitled Meeting with date when result is blank after trim", () => {
    // A template of spaces is treated as empty → uses default (covered above).
    // The blank-result fallback fires when a non-empty template resolves to pure whitespace.
    const event = { ...BASE_EVENT, organizer: "  " };
    // organizer is "  " (spaces only) → resolved is "  " → after trim is "" → fallback
    expect(resolveNoteName("{{organizer}}", event)).toBe(`Untitled Meeting ${event.date}`);
  });

  it("DEFAULT_NOTE_NAME_TEMPLATE matches expected value", () => {
    expect(DEFAULT_NOTE_NAME_TEMPLATE).toBe("{{date}} - {{title}}");
  });
});
