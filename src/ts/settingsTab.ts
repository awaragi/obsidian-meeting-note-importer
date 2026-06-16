import { AbstractInputSuggest, App, PluginSettingTab, Setting, TAbstractFile, TFile, TFolder } from "obsidian";
import type IcalMeetingNotesPlugin from "./main";

export interface IcalMeetingNotesSettings {
  /** Vault folder path where created notes are saved. Empty = vault root. */
  notesFolder: string;
  /** Vault path to an Obsidian template file. Empty = use built-in template. */
  templateFile: string;
  /** The exact heading line under which attendees are injected. */
  attendeesHeading: string;
  /** The exact heading line under which the meeting URL + description are injected. */
  notesHeading: string;
  /** Open the created note immediately after creation. */
  openAfterCreate: boolean;
}

export const DEFAULT_SETTINGS: IcalMeetingNotesSettings = {
  notesFolder: "",
  templateFile: "",
  attendeesHeading: "## Attendees",
  notesHeading: "## Notes",
  openAfterCreate: true,
};

// ── Folder suggest ─────────────────────────────────────────────────────────

class FolderSuggest extends AbstractInputSuggest<TFolder> {
  private onSelect: (value: string) => void;

  constructor(app: App, inputEl: HTMLInputElement, onSelect: (value: string) => void) {
    super(app, inputEl);
    this.onSelect = onSelect;
  }

  getSuggestions(query: string): TFolder[] {
    const lower = query.toLowerCase();
    const folders: TFolder[] = [];
    this.app.vault.getAllLoadedFiles().forEach((f: TAbstractFile) => {
      if (f instanceof TFolder && f.path.toLowerCase().contains(lower)) {
        folders.push(f);
      }
    });
    return folders.slice(0, 20);
  }

  renderSuggestion(folder: TFolder, el: HTMLElement) {
    el.setText(folder.isRoot() ? "/" : folder.path);
  }

  selectSuggestion(folder: TFolder) {
    const value = folder.isRoot() ? "" : folder.path;
    this.setValue(value);
    this.onSelect(value);
    this.close();
  }
}

// ── Markdown file suggest ──────────────────────────────────────────────────

class FileSuggest extends AbstractInputSuggest<TFile> {
  private onSelect: (value: string) => void;

  constructor(app: App, inputEl: HTMLInputElement, onSelect: (value: string) => void) {
    super(app, inputEl);
    this.onSelect = onSelect;
  }

  getSuggestions(query: string): TFile[] {
    const lower = query.toLowerCase();
    return this.app.vault
      .getMarkdownFiles()
      .filter((f) => f.path.toLowerCase().contains(lower))
      .slice(0, 20);
  }

  renderSuggestion(file: TFile, el: HTMLElement) {
    el.setText(file.path);
  }

  selectSuggestion(file: TFile) {
    this.setValue(file.path);
    this.onSelect(file.path);
    this.close();
  }
}

// ── Settings tab ───────────────────────────────────────────────────────────

export class IcalMeetingNotesSettingTab extends PluginSettingTab {
  plugin: IcalMeetingNotesPlugin;

  constructor(app: App, plugin: IcalMeetingNotesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "iCal Meeting Notes" });

    new Setting(containerEl)
      .setName("Notes folder")
      .setDesc("Vault folder where meeting notes are saved. Leave empty to save to the vault root.")
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl, async (value) => {
          this.plugin.settings.notesFolder = value;
          await this.plugin.saveSettings();
        });
        text
          .setPlaceholder("e.g. Meetings")
          .setValue(this.plugin.settings.notesFolder)
          .onChange(async (value) => {
            this.plugin.settings.notesFolder = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Template file")
      .setDesc(
        "Path to an Obsidian template file using {{date}} and {{title}} placeholders. " +
          "Leave empty to use the built-in template."
      )
      .addText((text) => {
        new FileSuggest(this.app, text.inputEl, async (value) => {
          this.plugin.settings.templateFile = value;
          await this.plugin.saveSettings();
        });
        text
          .setPlaceholder("e.g. _templates/Meeting.md")
          .setValue(this.plugin.settings.templateFile)
          .onChange(async (value) => {
            this.plugin.settings.templateFile = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Attendees heading")
      .setDesc("Exact heading line under which the attendee list is injected.")
      .addText((text) =>
        text
          .setPlaceholder("## Attendees")
          .setValue(this.plugin.settings.attendeesHeading)
          .onChange(async (value) => {
            this.plugin.settings.attendeesHeading = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Notes heading")
      .setDesc("Exact heading line under which the meeting URL and description are injected.")
      .addText((text) =>
        text
          .setPlaceholder("## Notes")
          .setValue(this.plugin.settings.notesHeading)
          .onChange(async (value) => {
            this.plugin.settings.notesHeading = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Open note after creation")
      .setDesc("Automatically open the newly created meeting note.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.openAfterCreate).onChange(async (value) => {
          this.plugin.settings.openAfterCreate = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
