import { MeetingEvent } from "./icalParser";

export const DEFAULT_NOTE_NAME_TEMPLATE = "{{date}} - {{title}}";

export function resolveNoteName(template: string, event: MeetingEvent): string {
  const tpl = template.trim() || DEFAULT_NOTE_NAME_TEMPLATE;
  const resolved = tpl
    .replace(/\{\{date\}\}/g, event.date)
    .replace(/\{\{title\}\}/g, event.title)
    .replace(/\{\{startTime\}\}/g, event.startTime)
    .replace(/\{\{endTime\}\}/g, event.endTime)
    .replace(/\{\{organizer\}\}/g, event.organizer);
  const safe = resolved.replace(/[\\/:*?"<>|]/g, "-").trim();
  return safe || `Untitled Meeting ${event.date}`;
}
