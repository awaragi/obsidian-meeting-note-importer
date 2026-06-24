import { App, Modal, Notice, Plugin, Setting, TFile } from "obsidian";
import { parseIcs, parseOutlookText } from "./icalParser";
import { createMeetingNote, overrideMeetingNote, resolveTargetFolder } from "./noteCreator";
import {
  DEFAULT_SETTINGS,
  IcalMeetingNotesSettings,
  IcalMeetingNotesSettingTab,
} from "./settingsTab";
import { t, locale } from "./i18n";

// ── Types ──────────────────────────────────────────────────────────────────

interface OverrideOptions {
  overrideNote: TFile | null;
  renameNote: boolean;
}

// ── Drop Modal ─────────────────────────────────────────────────────────────

class IcsDropModal extends Modal {
  private onDrop: (e: DragEvent, opts: OverrideOptions) => void;
  private onFilePicked: (file: File, opts: OverrideOptions) => void;
  private settings: IcalMeetingNotesSettings;

  private activeFile: TFile | null = null;
  private overrideNote = false;
  private renameNote = false;

  constructor(
    app: App,
    settings: IcalMeetingNotesSettings,
    onDrop: (e: DragEvent, opts: OverrideOptions) => void,
    onFilePicked: (file: File, opts: OverrideOptions) => void
  ) {
    super(app);
    this.settings = settings;
    this.onDrop = onDrop;
    this.onFilePicked = onFilePicked;
  }

  onOpen() {
    this.activeFile = this.app.workspace.getActiveFile();
    this.overrideNote = false;
    this.renameNote = false;

    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("ical-modal");

    contentEl.createEl("h2", { text: t("modal.title") });

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
      text: now.toLocaleString(locale(), { month: "short" }).toUpperCase(),
    });
    card.createDiv({ cls: "ical-cal-day", text: String(now.getDate()) });
    zone.createEl("p", { cls: "ical-drop-label", text: t("modal.drop_label") });
    zone.createEl("p", { cls: "ical-drop-hint", text: t("modal.drop_hint") });

    const folder = resolveTargetFolder(this.app, this.settings);
    const saveToKey = this.settings.useActiveFolder ? "modal.save_to_active" : "modal.save_to";

    // Save-to label (shown when override is OFF)
    const saveToEl = zone.createEl("p", { cls: "ical-save-location" });
    saveToEl.appendText(t(saveToKey));
    saveToEl.createEl("strong", { text: folder || t("modal.vault_root") });

    // Override label (shown when override is ON)
    const overrideLabelEl = zone.createEl("p", { cls: "ical-save-location" });
    overrideLabelEl.addClass("ical-hidden");
    const overrideLabelText = overrideLabelEl.createSpan();
    overrideLabelText.setText(t("modal.override_content_label"));
    overrideLabelEl.createEl("strong", {
      text: this.activeFile ? `${this.activeFile.basename}.md` : "",
    });

    // Hidden file input for click-to-browse
    const fileInput = contentEl.createEl("input", {
      type: "file",
      attr: { accept: ".ics,.ical,text/calendar", style: "display:none" },
    });
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (file) {
        const opts = this.buildOpts();
        this.close();
        this.onFilePicked(file, opts);
      }
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
      const opts = this.buildOpts();
      this.close();
      this.onDrop(e, opts);
    });

    // Override toggle (only when an active file exists)
    if (this.activeFile) {
      // Both renameRowContainer and renameToggle are assigned after their respective Settings
      // but are always defined by the time onChange fires (captured by reference).
      let renameRowContainer!: HTMLDivElement;
      let renameToggle!: { setValue: (v: boolean) => unknown };

      new Setting(contentEl)
        .setName(t("modal.override_toggle"))
        .addToggle((toggle) => {
          toggle.setValue(false).onChange((val) => {
            this.overrideNote = val;
            saveToEl.toggleClass("ical-hidden", val);
            overrideLabelEl.toggleClass("ical-hidden", !val);
            renameRowContainer.toggleClass("ical-hidden", !val);
            const seedRename = val ? this.settings.overrideRenameDefault : false;
            this.renameNote = seedRename;
            renameToggle.setValue(seedRename);
            overrideLabelText.setText(seedRename ? t("modal.override_rename_label") : t("modal.override_content_label"));
          });
        });

      renameRowContainer = contentEl.createDiv();
      renameRowContainer.addClass("ical-hidden");
      new Setting(renameRowContainer)
        .setName(t("modal.rename_toggle"))
        .addToggle((toggle) => {
          renameToggle = toggle;
          toggle.setValue(false).onChange((val) => {
            this.renameNote = val;
            overrideLabelText.setText(val ? t("modal.override_rename_label") : t("modal.override_content_label"));
          });
        });
    }
  }

  private buildOpts(): OverrideOptions {
    return {
      overrideNote: this.overrideNote ? this.activeFile : null,
      renameNote: this.renameNote,
    };
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ── Plugin ─────────────────────────────────────────────────────────────────

export default class IcalMeetingNotesPlugin extends Plugin {
  settings!: IcalMeetingNotesSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new IcalMeetingNotesSettingTab(this.app, this));

    this.addRibbonIcon("calendar-plus", t("ribbon.tooltip"), () => {
      this.openDropModal();
    });

    this.addCommand({
      id: "import-ics-meeting-note",
      name: t("command.name"),
      callback: () => this.openDropModal(),
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<IcalMeetingNotesSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private openDropModal() {
    new IcsDropModal(
      this.app,
      this.settings,
      (e, opts) => this.handleDrop(e, opts),
      (file, opts) => this.readFileAsText(file, opts)
    ).open();
  }

  /**
   * Try every possible transfer format Outlook / macOS might provide:
   * 1. dataTransfer.files — standard file drop (.ics file on disk)
   * 2. dataTransfer.getData("text/calendar") — inline iCal text
   * 3. dataTransfer.getData("text/plain") — plain text that might be iCal
   * 4. dataTransfer.items with getAsFile() — alternative file accessor
   */
  private handleDrop(e: DragEvent, opts: OverrideOptions) {
    const dt = e.dataTransfer;
    if (!dt) {
      new Notice(t("notice.no_data"));
      return;
    }

    // 1. Files — standard .ics file drop (e.g. from Finder)
    for (const file of Array.from(dt.files)) {
      if (file.type === "text/calendar" || /\.(ics|ical)$/i.test(file.name) || file.size > 0) {
        this.readFileAsText(file, opts);
        return;
      }
    }

    // 2. Items — alternative file accessor in some Electron contexts
    for (const item of Array.from(dt.items)) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          this.readFileAsText(file, opts);
          return;
        }
      }
    }

    // 3. Inline text — iCal format sent directly (text/calendar or text/plain)
    for (const mimeType of ["text/calendar", "text/plain"]) {
      const text = dt.getData(mimeType);
      if (!text) continue;
      if (text.includes("BEGIN:VCALENDAR")) {
        void this.processIcsContent(text, "dropped-event.ics", opts);
        return;
      }
      // 4. Outlook for Mac plain-text summary (no BEGIN:VCALENDAR)
      const event = parseOutlookText(text);
      if (event) {
        void this.processEvent(event, opts);
        return;
      }
    }

    new Notice(t("notice.no_calendar"));
  }

  private readFileAsText(file: File, opts: OverrideOptions) {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result;
      if (typeof raw === "string") await this.processIcsContent(raw, file.name, opts);
    };
    reader.onerror = () => new Notice(t("notice.read_failed"));
    reader.readAsText(file, "utf-8");
  }

  async processIcsContent(raw: string, sourceName: string, opts: OverrideOptions = { overrideNote: null, renameNote: false }) {
    let event;
    try {
      event = parseIcs(raw);
    } catch (err) {
      new Notice(t("notice.parse_failed", { name: sourceName, err: String(err) }));
      console.error("iCal Meeting Notes parse error:", err);
      return;
    }
    await this.processEvent(event, opts);
  }

  async processEvent(event: import("./icalParser").MeetingEvent, opts: OverrideOptions = { overrideNote: null, renameNote: false }) {
    let note;
    try {
      if (opts.overrideNote) {
        note = await overrideMeetingNote(this.app, event, this.settings, opts.overrideNote, opts.renameNote);
      } else {
        note = await createMeetingNote(this.app, event, this.settings);
      }
    } catch (err) {
      new Notice(t("notice.create_failed", { err: String(err) }));
      console.error("iCal Meeting Notes create error:", err);
      return;
    }

    const noticeKey = opts.overrideNote
      ? opts.renameNote ? "notice.note_overridden_renamed" : "notice.note_overridden"
      : "notice.note_created";
    new Notice(t(noticeKey, { name: note.basename }));
    if (this.settings.openAfterCreate) {
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(note);
    }
  }
}
