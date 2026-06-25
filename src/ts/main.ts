import { App, Modal, Notice, Plugin, Setting, TFile } from "obsidian";
import { parseIcs, parseOutlookText, MeetingEvent } from "./icalParser";
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

// ── Helpers ────────────────────────────────────────────────────────────────

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function roundToNearestIncrement(date: Date, incrementMinutes: number): string {
  const total = date.getHours() * 60 + date.getMinutes();
  const rounded = Math.round(total / incrementMinutes) * incrementMinutes;
  const clamped = rounded % (24 * 60);
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

function addMinutesToTime(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = ((h * 60 + m + minutes) % (24 * 60) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// ── Drop Modal ─────────────────────────────────────────────────────────────

class IcsDropModal extends Modal {
  private onDrop: (e: DragEvent, opts: OverrideOptions) => void;
  private onFilePicked: (file: File, opts: OverrideOptions) => void;
  private onManualCreate: (event: MeetingEvent, opts: OverrideOptions) => void;
  private settings: IcalMeetingNotesSettings;
  private initialTab: "file" | "manual";

  private activeFile: TFile | null = null;
  private overrideNote = false;
  private renameNote = false;

  constructor(
    app: App,
    settings: IcalMeetingNotesSettings,
    onDrop: (e: DragEvent, opts: OverrideOptions) => void,
    onFilePicked: (file: File, opts: OverrideOptions) => void,
    onManualCreate: (event: MeetingEvent, opts: OverrideOptions) => void,
    initialTab: "file" | "manual" = "file"
  ) {
    super(app);
    this.settings = settings;
    this.onDrop = onDrop;
    this.onFilePicked = onFilePicked;
    this.onManualCreate = onManualCreate;
    this.initialTab = initialTab;
  }

  onOpen() {
    this.activeFile = this.app.workspace.getActiveFile();
    this.overrideNote = false;
    this.renameNote = false;

    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("ical-modal");

    contentEl.createEl("h2", { text: t("modal.title") });

    // ── Tab bar ──────────────────────────────────────────────────────────
    const tabBar = contentEl.createDiv({ cls: "ical-tabs" });
    const tabFile = tabBar.createDiv({ cls: "ical-tab ical-tab--active", text: t("modal.tab_from_file") });
    const tabManual = tabBar.createDiv({ cls: "ical-tab", text: t("modal.tab_manual") });

    // ── Tab panels ───────────────────────────────────────────────────────
    const panelFile = contentEl.createDiv({ cls: "ical-tab-panel" });
    const panelManual = contentEl.createDiv({ cls: "ical-tab-panel ical-tab-panel--hidden" });

    this.buildFilePanel(panelFile);
    const manualTitleInput = this.buildManualPanel(panelManual);

    // ── Tab switching ────────────────────────────────────────────────────
    tabFile.addEventListener("click", () => {
      tabFile.addClass("ical-tab--active");
      tabManual.removeClass("ical-tab--active");
      panelFile.removeClass("ical-tab-panel--hidden");
      panelManual.addClass("ical-tab-panel--hidden");
    });

    tabManual.addEventListener("click", () => {
      tabManual.addClass("ical-tab--active");
      tabFile.removeClass("ical-tab--active");
      panelManual.removeClass("ical-tab-panel--hidden");
      panelFile.addClass("ical-tab-panel--hidden");
      manualTitleInput.focus();
    });

    // Activate the initial tab if requested
    if (this.initialTab === "manual") {
      tabManual.addClass("ical-tab--active");
      tabFile.removeClass("ical-tab--active");
      panelManual.removeClass("ical-tab-panel--hidden");
      panelFile.addClass("ical-tab-panel--hidden");
      setTimeout(() => manualTitleInput.focus(), 0);
    }

    // ── Shared section ───────────────────────────────────────────────────
    // Declare before the if-block so onChange closures can capture them.
    let saveToEl!: HTMLParagraphElement;
    let overrideLabelEl!: HTMLParagraphElement;
    let overrideLabelText!: HTMLSpanElement;

    // Toggles first
    if (this.activeFile) {
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

    // Target note info below the toggles
    const folder = resolveTargetFolder(this.app, this.settings);
    const saveToKey = this.settings.useActiveFolder ? "modal.save_to_active" : "modal.save_to";

    saveToEl = contentEl.createEl("p", { cls: "ical-save-location" });
    saveToEl.createEl("span", { cls: "ical-save-location__label", text: t(saveToKey) });
    saveToEl.createEl("span", { cls: "ical-save-location__value", text: folder || t("modal.vault_root") });

    overrideLabelEl = contentEl.createEl("p", { cls: "ical-save-location" });
    overrideLabelEl.addClass("ical-hidden");
    overrideLabelText = overrideLabelEl.createEl("span", { cls: "ical-save-location__label" });
    overrideLabelText.setText(t("modal.override_content_label"));
    overrideLabelEl.createEl("span", {
      cls: "ical-save-location__value",
      text: this.activeFile ? `${this.activeFile.basename}.md` : "",
    });
  }

  private buildFilePanel(container: HTMLElement): void {
    const zone = container.createDiv({ cls: "ical-drop-zone" });

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

    const fileInput = container.createEl("input", {
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
  }

  private buildManualPanel(container: HTMLElement): HTMLInputElement {
    const form = container.createDiv({ cls: "ical-manual-form" });

    // Title
    const titleRow = form.createDiv({ cls: "ical-manual-row" });
    titleRow.createEl("label", { cls: "ical-manual-label", text: t("modal.manual_title_label") });
    const titleInput = titleRow.createEl("input", {
      type: "text",
      attr: { placeholder: t("modal.manual_title_placeholder") },
    });

    // Date
    const dateRow = form.createDiv({ cls: "ical-manual-row" });
    dateRow.createEl("label", { cls: "ical-manual-label", text: t("modal.manual_date_label") });
    const dateInput = dateRow.createEl("input", {
      type: "date",
      attr: { value: todayISO() },
    });

    // Start time
    const startRow = form.createDiv({ cls: "ical-manual-row" });
    startRow.createEl("label", { cls: "ical-manual-label", text: t("modal.manual_start_label") });
    const startDefault = roundToNearestIncrement(new Date(), this.settings.timeIncrement);
    const stepSeconds = String(this.settings.timeIncrement * 60);
    const startInput = startRow.createEl("input", {
      type: "time",
      attr: { value: startDefault, step: stepSeconds },
    });

    // End time
    const endRow = form.createDiv({ cls: "ical-manual-row" });
    endRow.createEl("label", { cls: "ical-manual-label", text: t("modal.manual_end_label") });
    const endDefault = addMinutesToTime(startDefault, this.settings.timeIncrement);
    const endInput = endRow.createEl("input", {
      type: "time",
      attr: { value: endDefault, step: stepSeconds },
    });

    // Create button
    const btn = form.createEl("button", {
      cls: "mod-cta ical-manual-create",
      text: t("modal.manual_create_button"),
    });
    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btn.click();
    });

    btn.addEventListener("click", () => {
      const title = titleInput.value.trim() || t("modal.manual_title_placeholder");
      const event: MeetingEvent = {
        title,
        date: dateInput.value || todayISO(),
        startTime: startInput.value,
        endTime: endInput.value,
        organizer: "",
        attendees: [],
        description: "",
        location: "",
        meetingUrl: "",
      };
      const opts = this.buildOpts();
      this.close();
      this.onManualCreate(event, opts);
    });

    return titleInput;
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

    if (this.settings.showRibbonIcon) {
      this.addRibbonIcon("calendar-plus", t("ribbon.tooltip"), () => {
        this.openDropModal();
      });
    }

    this.addCommand({
      id: "import-ics-meeting-note",
      name: t("command.name"),
      callback: () => this.openDropModal(),
    });

    this.addCommand({
      id: "new-quick-meeting-note",
      name: t("command.quick_name"),
      callback: () => this.openDropModal("manual"),
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<IcalMeetingNotesSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private openDropModal(initialTab: "file" | "manual" = "file") {
    new IcsDropModal(
      this.app,
      this.settings,
      (e, opts) => this.handleDrop(e, opts),
      (file, opts) => this.readFileAsText(file, opts),
      (event, opts) => void this.processEvent(event, opts),
      initialTab
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

  async processEvent(event: MeetingEvent, opts: OverrideOptions = { overrideNote: null, renameNote: false }) {
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
