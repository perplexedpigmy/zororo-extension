# Privacy Policy for Zororo

**Last updated:** July 2026

Zororo is a browser extension that downloads shows and movies from ororo.tv. This privacy policy explains what data the extension collects, how it is used, and your rights.

## Data Collection

**Zororo does not collect, transmit, or share any personal data.** The extension operates entirely within your browser.

### What is stored locally

All data is stored in your browser's `chrome.storage.local` and never leaves your device:

| Data | Purpose |
|---|---|
| **Root directory** | Where downloaded files are saved on your computer |
| **Subtitle language preferences** | Which subtitle tracks to download |
| **Rating history** | Your personal star ratings for shows/movies on ororo.tv |
| **Download queue** | Temporary tracking of queued downloads |

### Network requests

The extension makes requests only to:

- **ororo.tv API** (`https://ororo.tv/api/v2/...`) — to fetch show data, episode lists, and download URLs. These requests include your session cookies so ororo.tv can authenticate you.
- **Chrome downloads API** — to trigger file downloads, running entirely in your browser.

### What is NOT collected

- No analytics, tracking, or telemetry
- No third-party servers
- No personal information (name, email, IP address)
- No browsing history outside of ororo.tv
- No crash reports or error logs are sent anywhere

## Third-Party Services

The extension does not integrate any third-party services, SDKs, or analytics frameworks.

## Data Sharing

Zororo does not sell, share, or transfer any user data to third parties.

## Changes to This Policy

If this policy changes, the version will be updated in the GitHub repository.

## Contact

For questions about this privacy policy, open an issue on GitHub:

[https://github.com/perplexedpigmy/zororo-extension](https://github.com/perplexedpigmy/zororo-extension)
