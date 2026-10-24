# MyStream (Android)

Android version of MultiGridView: a multi-stream grid for Tango Live, plus go-live alerts.

- **MyStream**: the grid. Tap **Controls** at the bottom for the dock (list, view, picture, chat, Alerts).
- **MyStream Alerts**: checks your list every few minutes and notifies you when someone goes live.

## Install on your phone
1. Open the **Releases** page of this repository on your phone.
2. Tap the newest `MyStream-v1.0.N.apk` and install it (allow installs from your browser when Android asks).
3. Newer versions install over older ones and keep your settings.

## How builds work
Every push to `main` builds the APK on GitHub (Actions) and publishes it as a release.
Builds are signed with the key stored in the repository secrets `KEYSTORE_B64` and `KEYSTORE_PASSWORD`.
Without those secrets a test (debug) build is published instead.

The Android grid is view-only: it never records streams. On Windows, a feed is recorded only when you choose
**Record this feed** in its tile menu, which uses Section Recorder (1.6.0 or newer) on the same PC.

## Windows app (`windows/`)
MultiGridView for Windows: the same grid plus **MultiGridView Alerts**, built into a normal installer.

- Download `MultiGridView-Setup-<version>.exe` from the newest **win-v…** release and double-click it.
- Windows may show "Windows protected your PC" (the installer isn't code-signed): **More info** > **Run anyway**.
- Installs for your account only, updates in place, keeps your settings. Uninstall from Settings > Apps.
- **Record this feed** (tile menu): records that tile's picture and that feed's own sound with Section Recorder.
  The sound comes only from that feed, even while the tile is muted. See `windows/app/rec-link.js`.
- To publish a new version: change the files in `windows/app/`, bump `windows/VERSION`, push.
