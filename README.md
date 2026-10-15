# MyStream (Android)

Android version of MultiGridView: a multi-stream grid for Tango Live, plus go-live alerts.

- **MyStream**: the grid. Tap **Controls** at the bottom for the dock (list, view, picture, chat, Tango account, Alerts).
- **MyStream Alerts**: checks your list every few minutes and notifies you when someone goes live.

## Install on your phone
1. Open the **Releases** page of this repository on your phone.
2. Tap the newest `MyStream-v1.0.N.apk` and install it (allow installs from your browser when Android asks).
3. Newer versions install over older ones and keep your settings.

## How builds work
Every push to `main` builds the APK on GitHub (Actions) and publishes it as a release.
Builds are signed with the key stored in the repository secrets `KEYSTORE_B64` and `KEYSTORE_PASSWORD`.
Without those secrets a test (debug) build is published instead.

The grid is view-only. The app never records streams. Your Tango password is typed into Tango's own site, never into the app.

## Windows app (`windows/`)
MultiGridView for Windows: the same grid plus **MultiGridView Alerts**, built into a normal installer.

- Download `MultiGridView-Setup-<version>.exe` from the newest **win-v…** release and double-click it.
- Windows may show "Windows protected your PC" (the installer isn't code-signed): **More info** > **Run anyway**.
- Installs for your account only, updates in place, keeps your settings. Uninstall from Settings > Apps.
- To publish a new version: change the files in `windows/app/`, bump `windows/VERSION`, push.
