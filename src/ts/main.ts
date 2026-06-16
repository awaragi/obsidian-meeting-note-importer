import { Modal, Notice, Plugin } from "obsidian";
import { parseIcs, parseOutlookText } from "./icalParser";
import { createMeetingNote } from "./noteCreator";
import {
  DEFAULT_SETTINGS,
  IcalMeetingNotesSettings,
  IcalMeetingNotesSettingTab,
} from "./settingsTab";

// ── Drop Modal ─────────────────────────────────────────────────────────────

class IcsDropModal extends Modal {
  private onDrop: (e: DragEvent) => void;
  private onFilePicked: (file: File) => void;

  constructor(
    app: import("obsidian").App,
    onDrop: (e: DragEvent) => void,
    onFilePicked: (file: File) => void
  ) {
    super(app);
    this.onDrop = onDrop;
    this.onFilePicked = onFilePicked;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("ical-modal");

    contentEl.createEl("h2", { text: "Import calendar event" });

    const zone = contentEl.createDiv({ cls: "ical-drop-zone" });

    // Calendar icon showing today's date
    const iconWrap = zone.createDiv({ cls: "ical-cal-icon" });
    const rings = iconWrap.createDiv({ cls: "ical-cal-rings" });
    rings.createDiv({ cls: "ical-cal-ring" });
    rings.createDiv({ cls: "ical-cal-ring" });
    const card = iconWrap.createDiv({ cls: "ical-cal-card" });
    const now = new Date();
    card.createDiv({
      cls: "ical-cal-header",
      text: now.toLocaleString("en", { month: "short" }).toUpperCase(),
    });
    card.createDiv({ cls: "ical-cal-day", text: String(now.getDate()) });
    zone.createEl("p", { cls: "ical-drop-label", text: "Drop .ics file here" });
    zone.createEl("p", {
      cls: "ical-drop-hint",
      text: "Drag a calendar event from Outlook, or click to browse for a .ics file.",
    });

    // Hidden file input for click-to-browse
    const fileInput = contentEl.createEl("input", {
      type: "file",
      attr: { accept: ".ics,.ical,text/calendar", style: "display:none" },
    });
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (file) { this.close(); this.onFilePicked(file); }
    });

    zone.addEventListener("click", () => fileInput.click());

    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.addClass("ical-drop-zone--over");
    });

    zone.addEventListener("dragleave", () => {
      zone.removeClass("ical-drop-zone--over");
    });

    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.removeClass("ical-drop-zone--over");
      this.close();
      this.onDrop(e);
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ── Plugin ─────────────────────────────────────────────────────────────────

export default class IcalMeetingNotesPlugin extends Plugin {
  settings: IcalMeetingNotesSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new IcalMeetingNotesSettingTab(this.app, this));

    this.addRibbonIcon("calendar-plus", "Import iCal meeting note", () => {
      this.openDropModal();
    });

    this.addCommand({
      id: "import-ics-meeting-note",
      name: "Import meeting note from .ics file",
      callback: () => this.openDropModal(),
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private openDropModal() {
    new IcsDropModal(
      this.app,
      (e) => this.handleDrop(e),
      (file) => this.readFileAsText(file)
    ).open();
  }

  /**
   * Try every possible transfer format Outlook / macOS might provide:
   * 1. dataTransfer.files — standard file drop (.ics file on disk)
   * 2. dataTransfer.getData("text/calendar") — inline iCal text
   * 3. dataTransfer.getData("text/plain") — plain text that might be iCal
   * 4. dataTransfer.items with getAsFile() — alternative file accessor
   */
  private handleDrop(e: DragEvent) {
    const dt = e.dataTransfer;
    if (!dt) {
      new Notice("iCal Meeting Notes: no data in the drop.");
      return;
    }

    // 1. Files — standard .ics file drop (e.g. from Finder)
    for (const file of Array.from(dt.files)) {
      if (file.type === "text/calendar" || /\.(ics|ical)$/i.test(file.name) || file.size > 0) {
        this.readFileAsText(file);
        return;
      }
    }

    // 2. Items — alternative file accessor in some Electron contexts
    for (const item of Array.from(dt.items)) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) { this.readFileAsText(file); return; }
      }
    }

    // 3. Inline text — iCal format sent directly (text/calendar or text/plain)
    for (const mimeType of ["text/calendar", "text/plain"]) {
      const text = dt.getData(mimeType);
      if (!text) continue;
      if (text.includes("BEGIN:VCALENDAR")) {
        this.processIcsContent(text, "dropped-event.ics");
        return;
      }
      // 4. Outlook for Mac plain-text summary (no BEGIN:VCALENDAR)
      const event = parseOutlookText(text);
      if (event) {
        this.processEvent(event);
        return;
      }
    }

    new Notice("iCal Meeting Notes: could not extract calendar data from the drop.");
  }

  private readFileAsText(file: File) {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result;
      if (typeof raw === "string") await this.processIcsContent(raw, file.name);
    };
    reader.onerror = () =>
      new Notice("iCal Meeting Notes: failed to read the file.");
    reader.readAsText(file, "utf-8");
  }

  async processIcsContent(raw: string, sourceName: string) {
    let event;
    try {
      event = parseIcs(raw);
    } catch (err) {
      new Notice(`iCal Meeting Notes: failed to parse ${sourceName} — ${String(err)}`);
      console.error("iCal Meeting Notes parse error:", err);
      return;
    }
    await this.processEvent(event);
  }

  async processEvent(event: import("./icalParser").MeetingEvent) {
    let note;
    try {
      note = await createMeetingNote(this.app, event, this.settings);
    } catch (err) {
      new Notice(`iCal Meeting Notes: failed to create note — ${String(err)}`);
      console.error("iCal Meeting Notes create error:", err);
      return;
    }

    new Notice(`Meeting note created: ${note.basename}`);
    if (this.settings.openAfterCreate) {
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(note);
    }
  }
}
