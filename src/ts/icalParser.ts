// ical.js ships a CommonJS bundle without full TypeScript generics — use explicit casts.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ICAL = require("ical.js") as typeof import("ical.js");

export interface MeetingEvent {
  title: string;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:mm (local)
  endTime: string;     // HH:mm (local)
  organizer: string;   // display name or email
  attendees: string[]; // display names or emails, organizer excluded
  description: string;
  location: string;
  meetingUrl: string;  // Teams / Zoom / Meet link, empty if not found
}

const MEETING_URL_PATTERNS = [
  /https:\/\/teams\.microsoft\.com\/[^\s<>"]+/i,
  /https:\/\/[a-z0-9.-]+\.zoom\.us\/[^\s<>"]+/i,
  /https:\/\/meet\.google\.com\/[^\s<>"]+/i,
  /https:\/\/teams\.live\.com\/[^\s<>"]+/i,
  /https:\/\/webex\.com\/[^\s<>"]+/i,
  /https:\/\/[a-z0-9.-]+\.webex\.com\/[^\s<>"]+/i,
];

function extractMeetingUrl(text: string): string {
  for (const pattern of MEETING_URL_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[0].replace(/[>)]+$/, "");
  }
  return "";
}

function formatTime(dateTime: InstanceType<typeof ICAL.Time>): string {
  const d = dateTime.toJSDate();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDate(dateTime: InstanceType<typeof ICAL.Time>): string {
  const d = dateTime.toJSDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function extractDisplayName(calAddress: string, params: Record<string, string>): string {
  if (params["cn"]) return params["cn"];
  return calAddress.replace(/^mailto:/i, "");
}

/**
 * Parse the plain-text meeting summary that Outlook for Mac puts in the
 * clipboard / dataTransfer when you drag a calendar event. Format:
 *
 *   [Subject]
 *   When: Monday, June 15, 2026 at 3:30 PM - 4:00 PM in (UTC-05:00)
 *   Where: Teams / location (optional)
 *   Note: [organizer] has organized this meeting. (optional)
 *   Invitees: Alice, Bob, ... (optional)
 *   [free-form description]
 */
export function parseOutlookText(text: string): MeetingEvent | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim());

  const whenIdx = lines.findIndex((l) => l.startsWith("When:"));
  if (whenIdx === -1) return null; // doesn't look like Outlook text

  // Everything before "When:" is the subject
  const title = lines.slice(0, whenIdx).join(" ").trim() || "Untitled Meeting";

  // Parse date/time: "Monday, June 15, 2026 at 3:30 PM - 4:00 PM in (UTC-05:00)"
  const whenLine = lines[whenIdx].replace(/^When:\s*/i, "");
  const dateTimeMatch = whenLine.match(
    /(\w+,\s+\w+\s+\d{1,2},\s+\d{4})\s+at\s+(\d{1,2}:\d{2}\s*[AP]M)\s*[-–]\s*(\d{1,2}:\d{2}\s*[AP]M)/i
  );

  let date = new Date().toISOString().slice(0, 10);
  let startTime = "";
  let endTime = "";

  if (dateTimeMatch) {
    const parsed = new Date(dateTimeMatch[1]);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      date = `${y}-${m}-${d}`;
    }
    startTime = dateTimeMatch[2].trim();
    endTime = dateTimeMatch[3].trim();
  }

  // Where:
  const whereLine = lines.find((l) => /^Where:/i.test(l));
  const location = whereLine ? whereLine.replace(/^Where:\s*/i, "").trim() : "";

  // Note: [name] has organized this meeting.
  const noteLine = lines.find((l) => /^Note:/i.test(l));
  const organizer = noteLine
    ? (noteLine.match(/^Note:\s*(.+?)\s+has organized/i)?.[1] ?? "")
    : "";

  // Invitees: comma-separated list
  const inviteesLine = lines.find((l) => /^Invitees:/i.test(l));
  const attendees = inviteesLine
    ? inviteesLine
        .replace(/^Invitees:\s*/i, "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // Remaining lines after the structured block = description
  const structuredPrefixes = /^(When|Where|Note|Invitees):/i;
  const descLines = lines.slice(whenIdx + 1).filter((l) => !structuredPrefixes.test(l));
  const description = descLines.join("\n").trim();

  const meetingUrl = extractMeetingUrl(description) || extractMeetingUrl(location);

  return { title, date, startTime, endTime, organizer, attendees, description, location, meetingUrl };
}

export function parseIcs(raw: string): MeetingEvent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jcal: any = ICAL.parse(raw);
  const comp = new ICAL.Component(jcal);
  const vevent = comp.getFirstSubcomponent("vevent");

  if (!vevent) throw new Error("No VEVENT found in the iCal file.");

  const title =
    (vevent.getFirstPropertyValue("summary") as string | null) ?? "Untitled Meeting";

  const dtstart = vevent.getFirstProperty("dtstart")?.getFirstValue() as
    | InstanceType<typeof ICAL.Time>
    | undefined;
  const dtend = vevent.getFirstProperty("dtend")?.getFirstValue() as
    | InstanceType<typeof ICAL.Time>
    | undefined;

  const date = dtstart ? formatDate(dtstart) : new Date().toISOString().slice(0, 10);
  const startTime = dtstart ? formatTime(dtstart) : "";
  const endTime = dtend ? formatTime(dtend) : "";

  const organizerProp = vevent.getFirstProperty("organizer");
  const organizer = organizerProp
    ? extractDisplayName(
        (organizerProp.getFirstValue() as string) ?? "",
        ((organizerProp.toJSON()?.[1]) as Record<string, string>) ?? {}
      )
    : "";

  const organizerEmail = organizerProp
    ? ((organizerProp.getFirstValue() as string) ?? "").replace(/^mailto:/i, "").toLowerCase()
    : "";

  const attendees: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vevent.getAllProperties("attendee").forEach((prop: any) => {
    const addr = (prop.getFirstValue() as string) ?? "";
    if (addr.replace(/^mailto:/i, "").toLowerCase() === organizerEmail) return;
    const params: Record<string, string> =
      ((prop.toJSON()?.[1]) as Record<string, string>) ?? {};
    attendees.push(extractDisplayName(addr, params));
  });

  const description =
    ((vevent.getFirstPropertyValue("description") as string | null) ?? "").trim();
  const location =
    ((vevent.getFirstPropertyValue("location") as string | null) ?? "").trim();
  const teamsUrl =
    ((vevent.getFirstPropertyValue("x-microsoft-skypeteamsmeetingurl") as string | null) ?? "").trim();
  const meetingUrl = teamsUrl || extractMeetingUrl(description) || extractMeetingUrl(location);

  return { title, date, startTime, endTime, organizer, attendees, description, location, meetingUrl };
}
