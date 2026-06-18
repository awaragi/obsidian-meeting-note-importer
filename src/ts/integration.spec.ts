import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { parseIcs, parseOutlookText, type MeetingEvent } from "./icalParser";

// Run with:  TEST_ICS_FILE=/path/to/file.ics npx vitest run
//            TEST_OUTLOOK_FILE=/path/to/invite.txt npx vitest run
const ICS_FILE = process.env.TEST_ICS_FILE;
const OUTLOOK_FILE = process.env.TEST_OUTLOOK_FILE;

const BUILTIN_TEMPLATE = `---
title: "{{date}} - {{title}}"
date: "{{date}}"
tags:
  - meeting
---
# {{date}} - {{title}}

## Attendees
-

## Invite Notes
-

## Notes
-

## Summary

## Action Items

- [ ] `;

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

function buildNote(event: MeetingEvent): string {
  let content = BUILTIN_TEMPLATE.replace(/\{\{date\}\}/g, event.date).replace(
    /\{\{title\}\}/g,
    event.title
  );
  const attendeesBlock = buildAttendeesBlock(event);
  if (attendeesBlock) content = injectUnderHeading(content, "## Attendees", attendeesBlock);
  const notesBlock = buildNotesBlock(event);
  if (notesBlock) content = injectUnderHeading(content, "## Invite Notes", notesBlock);
  return content;
}

function assertNote(event: MeetingEvent, note: string): void {
  expect(event.title).toBeTruthy();
  expect(event.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(note).toContain(event.title);
  expect(note).toContain(event.date);
  console.log(`\nParsed event:\n${JSON.stringify(event, null, 2)}\n`);
  console.log(`Generated note:\n${"─".repeat(60)}\n${note}\n${"─".repeat(60)}\n`);
}

describe.skipIf(!ICS_FILE)("ICS file integration [TEST_ICS_FILE]", () => {
  it("parses the file and generates a note", () => {
    const raw = readFileSync(ICS_FILE!, "utf-8");
    const event = parseIcs(raw);
    const note = buildNote(event);
    assertNote(event, note);
  });
});

describe.skipIf(!OUTLOOK_FILE)("Outlook text integration [TEST_OUTLOOK_FILE]", () => {
  it("parses the file and generates a note", () => {
    const raw = readFileSync(OUTLOOK_FILE!, "utf-8");
    const event = parseOutlookText(raw);
    expect(event, "File does not look like Outlook meeting text (no 'When:' line found)").not.toBeNull();
    const note = buildNote(event!);
    assertNote(event!, note);
  });
});
