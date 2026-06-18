import { describe, expect, it } from "vitest";
import { parseOutlookText } from "./icalParser";

describe("parseOutlookText", () => {
  const BASE =
    "Team Sync\nWhen: Monday, June 15, 2026 at 3:30 PM - 4:00 PM in (UTC-05:00)\nWhere: Conference Room A\nNote: Alice Smith has organized this meeting.\nInvitees: Bob Jones, Carol White\nPlease review the agenda before joining.";

  it("returns null when no 'When:' line is present", () => {
    expect(parseOutlookText("Just some random text")).toBeNull();
  });

  it("parses title from lines before When:", () => {
    const result = parseOutlookText(BASE);
    expect(result?.title).toBe("Team Sync");
  });

  it("parses date in YYYY-MM-DD format", () => {
    const result = parseOutlookText(BASE);
    expect(result?.date).toBe("2026-06-15");
  });

  it("parses start and end times", () => {
    const result = parseOutlookText(BASE);
    expect(result?.startTime).toBe("3:30 PM");
    expect(result?.endTime).toBe("4:00 PM");
  });

  it("parses location from Where: line", () => {
    const result = parseOutlookText(BASE);
    expect(result?.location).toBe("Conference Room A");
  });

  it("parses organizer from Note: line", () => {
    const result = parseOutlookText(BASE);
    expect(result?.organizer).toBe("Alice Smith");
  });

  it("parses attendees from Invitees: line", () => {
    const result = parseOutlookText(BASE);
    expect(result?.attendees).toEqual(["Bob Jones", "Carol White"]);
  });

  it("parses description from remaining lines", () => {
    const result = parseOutlookText(BASE);
    expect(result?.description).toBe("Please review the agenda before joining.");
  });

  it("uses 'Untitled Meeting' when subject lines are empty", () => {
    const text = "When: Monday, June 15, 2026 at 3:30 PM - 4:00 PM in (UTC-05:00)";
    const result = parseOutlookText(text);
    expect(result?.title).toBe("Untitled Meeting");
  });

  it("extracts Teams URL from description into meetingUrl", () => {
    const text =
      "Standup\nWhen: Monday, June 15, 2026 at 9:00 AM - 9:15 AM in (UTC-05:00)\nhttps://teams.microsoft.com/l/meetup-join/abc123";
    const result = parseOutlookText(text);
    expect(result?.meetingUrl).toBe("https://teams.microsoft.com/l/meetup-join/abc123");
  });

  it("extracts Zoom URL from description into meetingUrl", () => {
    const text =
      "Demo\nWhen: Monday, June 15, 2026 at 2:00 PM - 3:00 PM in (UTC-05:00)\nhttps://company.zoom.us/j/12345678";
    const result = parseOutlookText(text);
    expect(result?.meetingUrl).toBe("https://company.zoom.us/j/12345678");
  });

  it("returns empty meetingUrl when no meeting link found", () => {
    const result = parseOutlookText(BASE);
    expect(result?.meetingUrl).toBe("");
  });

  it("returns empty attendees when no Invitees: line", () => {
    const text =
      "Solo\nWhen: Monday, June 15, 2026 at 10:00 AM - 10:30 AM in (UTC-05:00)\nNote: Alice has organized this meeting.";
    const result = parseOutlookText(text);
    expect(result?.attendees).toEqual([]);
  });

  it("returns empty organizer when no Note: line", () => {
    const text = "Solo\nWhen: Monday, June 15, 2026 at 10:00 AM - 10:30 AM in (UTC-05:00)";
    const result = parseOutlookText(text);
    expect(result?.organizer).toBe("");
  });

  it("handles multi-line subject", () => {
    const text =
      "Project Alpha\nKickoff Meeting\nWhen: Monday, June 15, 2026 at 1:00 PM - 2:00 PM in (UTC-05:00)";
    const result = parseOutlookText(text);
    expect(result?.title).toBe("Project Alpha Kickoff Meeting");
  });
});
