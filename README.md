# AXIOM JAVELIN - Security Guardian Mobile Application

A comprehensive mobile security application providing real-time monitoring through a unified dashboard, featuring anti-phishing protection, deepfake detection, and anti-ransomware defense capabilities.

## 🛡️ Features

- **Anti-Phishing Shield**: Real-time URL scanning and phishing threat detection
- **Deepfake Scanner**: CNN-based image analysis for detecting manipulated media
- **Anti-Ransomware Shield**: 
  - Secure Vault with encrypted file storage
  - Real-time Threat Monitor
  - File Integrity Check
  - Ransomware Attack Simulator
- **Unified Dashboard**: Real-time monitoring of all security modules

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Mobile**: Capacitor (Android/iOS)
- **Backend**: Python FastAPI (to be connected)

---

## 📱 Running on Android (Android Studio)

### Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Android Studio** - [Download](https://developer.android.com/studio)
3. **Java JDK 17** - Usually comes with Android Studio
4. **Git** - [Download](https://git-scm.com/)

### Android Studio Setup

1. Open Android Studio
2. Go to **Tools → SDK Manager**
3. Install the following:
   - **SDK Platforms**: Android 13 (API 33) or higher
   - **SDK Tools**: 
     - Android SDK Build-Tools
     - Android SDK Command-line Tools
     - Android Emulator
     - Android SDK Platform-Tools

4. Create an Android Virtual Device (AVD):
   - Go to **Tools → Device Manager**
   - Click **Create Device**
   - Select a phone (e.g., Pixel 6)
   - Select a system image (e.g., API 33)
   - Finish the setup

### Step-by-Step Instructions

#### Step 1: Export Project to GitHub

1. In Lovable, click the **"Export to GitHub"** button (top right)
2. Connect your GitHub account if not already connected
3. Create a new repository or select an existing one

#### Step 2: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

#### Step 3: Install Dependencies

```bash
npm install
```

#### Step 4: Add Android Platform

```bash
npx cap add android
```

This will create an `android` folder in your project root containing the native Android project.

#### Step 5: Update Android Platform

```bash
npx cap update android
```

#### Step 6: Build the Web App

```bash
npm run build
```

#### Step 7: Sync with Android

```bash
npx cap sync android
```

This syncs your web app with the native Android project.

#### Step 8: Open in Android Studio

```bash
npx cap open android
```

This opens the Android project in Android Studio.

#### Step 9: Run the App

**Option A: Run on Emulator**
1. In Android Studio, click the **Run** button (green play icon)
2. Select your virtual device
3. Wait for the app to build and launch

**Option B: Run on Physical Device**
1. Enable **Developer Options** on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
2. Enable **USB Debugging** in Developer Options
3. Connect your phone via USB
4. Allow USB debugging when prompted
5. In Android Studio, select your device and click **Run**

**Option C: Run via Command Line**
```bash
npx cap run android
```

---

## 🔄 Development Workflow

### Hot Reload (Live Development)

The app is configured to connect to the Lovable preview URL for hot reload during development. Any changes you make in Lovable will be reflected in the mobile app immediately.

### After Making Changes in Lovable

Whenever you make changes in Lovable and want to sync them:

```bash
git pull origin main
npm install
npm run build
npx cap sync android
```

### Building for Production

When ready to build a production APK:

1. In `capacitor.config.ts`, comment out or remove the `server` section:
```typescript
// server: {
//   url: '...',
//   cleartext: true
// },
```

2. Build and sync:
```bash
npm run build
npx cap sync android
```

3. In Android Studio:
   - Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - Find the APK in `android/app/build/outputs/apk/debug/`

---

## 📁 Project Structure

```
axiom-javelin/
├── android/                 # Native Android project (created after `npx cap add android`)
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/               # Application pages
│   ├── services/            # API service layer
│   └── hooks/               # Custom React hooks
├── public/                  # Static assets
├── capacitor.config.ts      # Capacitor configuration
├── vite.config.ts           # Vite configuration
└── package.json
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "SDK location not found"**
- Open Android Studio and go to **Tools → SDK Manager**
- Note the SDK location
- Create a `local.properties` file in the `android` folder with:
  ```
  sdk.dir=/path/to/your/Android/Sdk
  ```

**2. "Gradle build failed"**
- Ensure Java 17 is installed
- In Android Studio: **File → Invalidate Caches → Restart**

**3. "App shows blank screen"**
- Check that the Lovable preview URL is accessible
- Ensure your device/emulator has internet access
- Check the console in Android Studio for errors

**4. "Unable to install APK"**
- Enable "Install from Unknown Sources" on your device
- Make sure no older version of the app is installed

### Getting Help

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Guide](https://developer.android.com/studio/intro)
- [Lovable Mobile Development Guide](https://docs.lovable.dev/tips-tricks/mobile-development)

---

## 🔗 Useful Commands Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npx cap add android` | Add Android platform |
| `npx cap sync android` | Sync web app with Android |
| `npx cap open android` | Open in Android Studio |
| `npx cap run android` | Build and run on device/emulator |

---

## How can I edit this code?

**Use Lovable**

Simply visit the Lovable Project and start prompting. Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

Clone this repo and push changes. Pushed changes will also be reflected in Lovable.

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start the development server
npm run dev
```
