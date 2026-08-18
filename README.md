# Grid Tab — Custom New Tab

A calm, customizable new tab page for Chrome. Open a new tab and you're greeted by name, with the time, a fast command bar, and a grid of widgets you choose and arrange yourself. No clutter, no noise — just the things you actually use, laid out the way you like.

![Grid Tab](https://img.shields.io/badge/Manifest-V3-5A4BFF) ![Version](https://img.shields.io/badge/version-2.0.0-5A4BFF)

---

## Features

- **Bookmarks** — add links manually or import the ones already in your browser. Real website icons are fetched automatically. Drag to reorder, and drop one icon onto another to group them into a folder.
- **Tasks** — a simple, satisfying to-do list.
- **Up Next** — your upcoming reminders at a glance.
- **Calendar** — interactive. Click any day to add a reminder; it shows up in Up Next and nudges you until you dismiss it.
- **Notes** — a quiet space for anything on your mind.
- **Image** — drop in a photo to make the space yours (fill or fit).
- **Focus** — a built-in focus timer.

### Make it yours
- Resize any widget by dragging its edges or corners; everything stays neatly aligned.
- Give any single widget its own background color — the text automatically adjusts light or dark so it always stays readable.
- Pick an accent color, background style, and border style — or choose your own exact colors.
- Auto, Light, and Dark appearance modes.

### Fast by design
- Press <kbd>/</kbd> or <kbd>⌘</kbd><kbd>K</kbd> to open the command bar — jump to any bookmark or search the web instantly.
- Smooth, iOS-style widget movement — drag a widget and the others glide out of the way.

### Syncs with you
Your entire setup saves to your Google account through Chrome sync and restores automatically on any computer signed into the same Chrome profile. Set it up once; it follows you everywhere.

---

## Install (from source, for development)

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select the `build/` folder.
5. Open a new tab — Grid Tab is now your new-tab page.

> The published version is available on the Chrome Web Store.

---

## Permissions

| Permission | Why it's needed |
|---|---|
| `storage` | Saves your layout, widgets, bookmarks, tasks, reminders, notes and theme on your device, and syncs settings (excluding large images) to your own Google account so your setup restores on other computers. |
| `bookmarks` | **Read-only.** Used only for the optional "Import from Chrome" feature, which copies your existing bookmarks into the dashboard. Bookmarks are never modified or transmitted anywhere. |

---

## Privacy

Grid Tab has **no server, no accounts, no analytics, and no tracking**. Your content lives in your browser. The only outbound requests are Google's public favicon service (to show bookmark icons) and a web search when you press Enter in the command bar with no match. See [`privacy-policy.html`](privacy-policy.html) for full details.

---

## Project structure

```
build/
├── manifest.json        # MV3 manifest
├── newtab.html          # new-tab page markup
├── app.js               # all extension logic
├── style.css            # styles
├── privacy-policy.html  # privacy policy
└── icons/               # 16 / 48 / 128 px icons
```

---

## License

© 2026 Grid Tab. All rights reserved.
