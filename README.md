<picture>
  <source media="(prefers-color-scheme: dark)" srcset="icons/icon128.png">
  <img alt="Zororo" src="icons/icon128.png" width="48" align="left">
</picture>

# Zororo

**One-click downloader for [ororo.tv](https://ororo.tv) shows and movies.**

Automatically organizes episodes by season, skips already-downloaded files, lets you rate your watched content, and supports 9 languages.

---

## Features

- **One-click downloads** — Downloads the current show or movie with a single click.
- **Smart skip** — Detects files already on disk, never duplicates.
- **Auto-organized folders** — Saves as `<Root>/<Show Name>/s<NN>/<NN>.<Episode Name>.mp4`.
- **Batch queue** — Select multiple seasons, download them all at once.
- **Missing episode detection** — Greyed-out episodes with an amber "N missing" badge for incomplete seasons.
- **Star rating system** — Click a star to rate, click again to remove. Auto-saves instantly (no save button).
- **Subtitle selection** — Choose which languages to download; default language gets a bare `.srt`, others get `.<lang>.srt`.
- **9-language UI** — Detected from ororo.tv URL prefix: English, French, German, Spanish, Portuguese, Russian, Italian, Polish, Turkish.
- **Cross-browser** — Works on Firefox, Chrome, Brave, and Edge.

---

## Installation

### Firefox
[Install from Firefox Add-ons](https://addons.mozilla.org/firefox/addon/zororo/) *(coming soon)*

### Chrome / Brave / Edge
[Install from Chrome Web Store](https://chromewebstore.google.com/...) *(coming soon)*

### Manual (developer mode)
1. Clone this repo.
2. **Firefox**: `just build-firefox` → load `zororo-firefox.zip` in `about:addons` → gear icon → Install Add-on From File.
3. **Chrome**: `just build-chrome` → open `chrome://extensions` → Enable Developer Mode → Load unpacked → select the `extension/` folder.

---

## Usage

1. Go to any show or movie page on **ororo.tv**.
2. A panel appears on the right with:
   - **Star rating** — click to rate (auto-saves to "Rated" list).
   - **Season tabs** — browse episodes, see which are missing.
   - **Download Selected** — queues selected episodes for download.
3. Files are saved to your configured root directory.

---

## Configuration

Right-click the extension icon → **Options** (or `about:addons` → Zororo → Preferences on Firefox).

| Setting | Description |
|---|---|
| **Root directory** | Base folder for all downloads (e.g. `Zororo/`). |
| **Subtitle languages** | Comma-separated language codes to download (e.g. `en, fr, de`). |
| **Default subtitle** | The language that gets the bare filename (no language suffix). |

You can also **export / import your rated list** as JSON from the options page.

---

## Localization

Zororo automatically detects your language from the ororo.tv URL path prefix:

| Prefix | Language |
|---|---|
| `/en/` | English |
| `/fr/` | French |
| `/de/` | German |
| `/es/` | Spanish |
| `/pt/` | Portuguese |
| `/ru/` | Russian |
| `/it/` | Italian |
| `/pl/` | Polish |
| `/tr/` | Turkish |

The popup and options pages are always in English.

---

<details>
<summary><strong>❤️ Support Zororo</strong></summary>

<br>

If this extension helps you, consider supporting development:

### ☕ Buy me a coffee

[b两极polarbear](https://buymeacoffee.com/pipolarbear)

### Cryptocurrency

| BTC | ETH | SOL |
|---|---|---|
| ![BTC](https://api.qrserver.com/v1/create-qr-code/?size=200&data=bc1qgyffnlhp2uz2uhpmhfrspc5qxpj3y9m4lwgga5) | ![ETH](https://api.qrserver.com/v1/create-qr-code/?size=200&data=0x581b4810873698505FDF3aAf0a39430bb0D7d655) | ![SOL](https://api.qrserver.com/v1/create-qr-code/?size=200&data=6awadeXmfc7JUMQL5SEgZXDE4yaFDgWkPNRySLDDmh7E) |
| `bc1qgyffnlhp2uz2uhpmhfrspc5qxpj3y9m4lwgga5` | `0x581b4810873698505FDF3aAf0a39430bb0D7d655` | `6awadeXmfc7JUMQL5SEgZXDE4yaFDgWkPNRySLDDmh7E` |

</details>

---

## Privacy

Zororo runs entirely on ororo.tv. **No data is collected, no analytics, no third-party servers.** All settings, ratings, and download history are stored locally in your browser's `chrome.storage.local`.

---

## License

MIT
