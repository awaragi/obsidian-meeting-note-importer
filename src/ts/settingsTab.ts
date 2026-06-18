import {
  AbstractInputSuggest,
  App,
  PluginSettingTab,
  Setting,
  TAbstractFile,
  TFile,
  TFolder,
} from "obsidian";
import type IcalMeetingNotesPlugin from "./main";
import { t } from "./i18n";

export interface IcalMeetingNotesSettings {
  /** Vault folder path where created notes are saved. Empty = vault root. */
  notesFolder: string;
  /** When true, save in the folder of the currently open file instead of notesFolder. */
  useActiveFolder: boolean;
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
  useActiveFolder: true,
  templateFile: "",
  attendeesHeading: "## Attendees",
  notesHeading: "## Invite Notes",
  openAfterCreate: true,
};

// ── Folder suggest ─────────────────────────────────────────────────────────

class FolderSuggest extends AbstractInputSuggest<TFolder> {
  private selectCallback: (value: string) => void;

  constructor(app: App, inputEl: HTMLInputElement, onSelect: (value: string) => void) {
    super(app, inputEl);
    this.selectCallback = onSelect;
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
    this.selectCallback(value);
    this.close();
  }
}

// ── Markdown file suggest ──────────────────────────────────────────────────

class FileSuggest extends AbstractInputSuggest<TFile> {
  private selectCallback: (value: string) => void;

  constructor(app: App, inputEl: HTMLInputElement, onSelect: (value: string) => void) {
    super(app, inputEl);
    this.selectCallback = onSelect;
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
    this.selectCallback(file.path);
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
    containerEl.createEl("h2", { text: t("settings.heading") });

    new Setting(containerEl)
      .setName(t("settings.active_folder.name"))
      .setDesc(t("settings.active_folder.desc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.useActiveFolder).onChange(async (value) => {
          this.plugin.settings.useActiveFolder = value;
          await this.plugin.saveSettings();
          this.display();
        })
      );

    new Setting(containerEl)
      .setName(t("settings.folder.name"))
      .setDesc(t("settings.folder.desc"))
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl, async (value) => {
          this.plugin.settings.notesFolder = value;
          await this.plugin.saveSettings();
        });
        text
          .setPlaceholder(t("settings.folder.placeholder"))
          .setValue(this.plugin.settings.notesFolder)
          .onChange(async (value) => {
            this.plugin.settings.notesFolder = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(t("settings.template.name"))
      .setDesc(t("settings.template.desc"))
      .addText((text) => {
        new FileSuggest(this.app, text.inputEl, async (value) => {
          this.plugin.settings.templateFile = value;
          await this.plugin.saveSettings();
        });
        text
          .setPlaceholder(t("settings.template.placeholder"))
          .setValue(this.plugin.settings.templateFile)
          .onChange(async (value) => {
            this.plugin.settings.templateFile = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(t("settings.attendees_heading.name"))
      .setDesc(t("settings.attendees_heading.desc"))
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
      .setName(t("settings.notes_heading.name"))
      .setDesc(t("settings.notes_heading.desc"))
      .addText((text) =>
        text
          .setPlaceholder("## Invite Notes")
          .setValue(this.plugin.settings.notesHeading)
          .onChange(async (value) => {
            this.plugin.settings.notesHeading = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.open_after.name"))
      .setDesc(t("settings.open_after.desc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.openAfterCreate).onChange(async (value) => {
          this.plugin.settings.openAfterCreate = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
