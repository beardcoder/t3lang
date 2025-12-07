# Code Signing Guide for T3Lang

## macOS Gatekeeper Issue

When you build and try to open the app on macOS, you might see:

**German:** "T3Lang ist beschädigt und kann nicht geöffnet werden. Es empfiehlt sich, das Objekt in den Papierkorb zu bewegen."

**English:** "T3Lang is damaged and cannot be opened. You should move it to the Trash."

This is **not** because the app is actually damaged - it's macOS Gatekeeper protecting you from unsigned apps.

## Solutions

### Option 1: Quick Fix (Local Development)

Remove the quarantine attribute:

```bash
xattr -cr "/path/to/T3Lang.app"
```

Or for the built app:

```bash
xattr -cr "./src-tauri/target/release/bundle/macos/T3Lang.app"
```

### Option 2: Right-Click Open

1. Right-click (or Control+click) on the app
2. Select "Open"
3. Click "Open" in the security dialog
4. The app will open and be remembered

### Option 3: System Settings

1. Try to open the app (it will fail)
2. Go to System Settings → Privacy & Security
3. Scroll down to the security section
4. Click "Open Anyway" next to the T3Lang message
5. Confirm in the dialog

## For Distribution: Code Signing

To distribute your app to others, you need an Apple Developer account and code signing.

### Prerequisites

1. **Apple Developer Account** ($99/year)
2. **Developer ID Application Certificate**
   - Log in to https://developer.apple.com
   - Go to Certificates, Identifiers & Profiles
   - Create a "Developer ID Application" certificate
   - Download and install in Keychain

### Configure Code Signing

1. Find your signing identity:

```bash
security find-identity -v -p codesigning
```

2. Update `src-tauri/tauri.conf.json`:

```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAMID)",
      "entitlements": null,
      "providerShortName": null
    }
  }
}
```

3. Build the signed app:

```bash
npm run tauri build
```

### GitHub Actions Code Signing

To enable code signing in GitHub Actions:

1. **Export your certificate** from Keychain:
   - Open Keychain Access
   - Find your "Developer ID Application" certificate
   - Right-click → Export
   - Save as `.p12` with a password

2. **Add GitHub Secrets**:
   - Go to your repo → Settings → Secrets and variables → Actions
   - Add these secrets:
     - `APPLE_CERTIFICATE`: Base64 encoded `.p12` file
     - `APPLE_CERTIFICATE_PASSWORD`: Your certificate password
     - `APPLE_SIGNING_IDENTITY`: Your signing identity name
     - `APPLE_ID`: Your Apple ID email
     - `APPLE_PASSWORD`: App-specific password
     - `APPLE_TEAM_ID`: Your Team ID

3. **Encode certificate**:

```bash
base64 -i certificate.p12 | pbcopy
```

4. The GitHub Actions workflow will automatically sign the app on release.

### Notarization (Optional but Recommended)

Notarization makes your app trusted by Gatekeeper without user intervention.

1. **Create an app-specific password**:
   - Go to https://appleid.apple.com
   - Sign in → Security → App-Specific Passwords
   - Generate a new password

2. **Update GitHub secrets** (add the password as `APPLE_PASSWORD`)

3. The GitHub Actions workflow will handle notarization automatically.

## Troubleshooting

### "No identity found"

Your certificate isn't installed. Make sure you've downloaded and installed the Developer ID Application certificate from Apple Developer.

### "Unable to validate your application"

Your Team ID or Apple ID credentials are incorrect. Double-check all GitHub secrets.

### Still having issues?

For local development, use Option 1 (remove quarantine) or Option 2 (right-click open). Code signing is only necessary for distribution.
