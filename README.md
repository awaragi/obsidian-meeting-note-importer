# Meeting Note Importer

An Obsidian plugin that creates structured meeting notes from calendar invites — drop a `.ics` file or drag a meeting directly from Outlook into Obsidian.

## Features

- **Drag and drop a `.ics` file** from Finder, Explorer, or any file manager
- **Drag a meeting directly from Outlook for Mac** — no file export needed
- **Click to browse** for a `.ics` file via the file picker
- Populates title, date, attendees, organizer, location, meeting URL, and description automatically
- Skips duplicate notes — if a note for that meeting already exists it is returned without overwriting
- Supports a custom Obsidian template with `{{date}}` and `{{title}}` placeholders
- Configurable target folder and heading names for attendees and notes sections

## Usage

Click the **calendar** icon in the ribbon, or run the command **Import meeting note from calendar invite**, then:

- Drag a `.ics` file into the drop zone, or
- Drag a meeting event directly from Outlook for Mac, or
- Click the drop zone to browse for a `.ics` file

The plugin creates a note in the configured folder and opens it immediately.

### Default note structure

```markdown
---
title: "2024-06-15 - Team Sync"
date: "2024-06-15"
tags:
  - meeting
---
# 2024-06-15 - Team Sync

## Attendees
- Jane Smith (Organizer)
- John Doe

## Notes
> https://teams.microsoft.com/meet/...

## Summary

## Action Items

- [ ]
```

## Settings

| Setting | Default | Description |
|---|---|---|
| Notes folder | _(vault root)_ | Folder where meeting notes are saved |
| Template file | _(built-in)_ | Path to a custom Obsidian template |
| Attendees heading | `## Attendees` | Heading under which attendees are injected |
| Notes heading | `## Notes` | Heading under which the meeting URL and description are injected |
| Open note after creation | On | Automatically open the note after it is created |

## Installation

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest)
2. Copy them into your vault at `.obsidian/plugins/obsidian-meeting-note-importer/`
3. Enable the plugin in **Settings → Community plugins**

## Development

```bash
# Install dependencies
npm install

# Copy .env.example and set your vault plugin path
cp .env.example .env

# Development build (with sourcemaps)
npm run dev

# Production build
npm run build

# Copy dist/ to your local vault (reads OBSIDIAN_PLUGIN_DIR from .env)
npm run deploy

# Development build + deploy in one step
npm run dev:deploy

# Remove dist/
npm run clean
```

### Releases

Push a version tag to trigger a GitHub Actions build and draft release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The release will contain `main.js`, `manifest.json`, and `styles.css` as flat assets ready for manual installation.
