import { App, Notice, TFile, TFolder, normalizePath } from "obsidian";
import { MeetingEvent } from "./icalParser";
import { IcalMeetingNotesSettings } from "./settingsTab";
import { t } from "./i18n";

const BUILTIN_TEMPLATE = `---
title: "{{date}} - {{title}}"
date: "{{date}}"
tags:
  - meeting
---
# {{date}} - {{title}}

## Attendees
- 

## Notes
- 

## Summary

## Action Items

- [ ] `;

/**
 * Find `heading` in the content lines and insert `block` below it.
 * If a lone placeholder bullet (`-` or `- `) immediately follows, replace it.
 * Otherwise insert after the heading line.
 */
function injectUnderHeading(content: string, heading: string, block: string): string {
  if (!heading || !block) return content;
  const lines = content.split("\n");
  const idx = lines.findIndex((l) => l.trimEnd() === heading.trimEnd());
  if (idx === -1) return content;

  // Find first non-empty line after heading
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
  if (event.organizer) items.push(`- ${event.organizer} (${t("organizer_label")})`);
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

async function ensureFolder(app: App, folderPath: string): Promise<void> {
  if (!folderPath) return;
  const existing = app.vault.getAbstractFileByPath(folderPath);
  if (existing instanceof TFolder) return;
  await app.vault.createFolder(folderPath);
}

export async function createMeetingNote(
  app: App,
  event: MeetingEvent,
  settings: IcalMeetingNotesSettings
): Promise<TFile> {
  const safeTitle = event.title.replace(/[\\/:*?"<>|]/g, "-").trim();
  const fileName = `${event.date} - ${safeTitle}.md`;
  const folder = settings.notesFolder ? normalizePath(settings.notesFolder) : "";
  const filePath = folder ? normalizePath(`${folder}/${fileName}`) : normalizePath(fileName);

  // Return existing note without overwriting
  const existing = app.vault.getAbstractFileByPath(filePath);
  if (existing instanceof TFile) {
    new Notice(t("notice.note_exists", { name: fileName }));
    return existing;
  }

  // Load template
  let raw = BUILTIN_TEMPLATE;
  if (settings.templateFile) {
    const tf = app.vault.getAbstractFileByPath(normalizePath(settings.templateFile));
    if (tf instanceof TFile) raw = await app.vault.read(tf);
  }

  // Simple search-and-replace — same {{placeholder}} syntax as Obsidian Templates
  let content = raw.replace(/\{\{date\}\}/g, event.date).replace(/\{\{title\}\}/g, event.title);

  const attendeesBlock = buildAttendeesBlock(event);
  if (attendeesBlock)
    content = injectUnderHeading(content, settings.attendeesHeading, attendeesBlock);

  const notesBlock = buildNotesBlock(event);
  if (notesBlock) content = injectUnderHeading(content, settings.notesHeading, notesBlock);

  await ensureFolder(app, folder);
  return await app.vault.create(filePath, content);
}
