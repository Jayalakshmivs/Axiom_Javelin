# 🛡️ AXIOM JAVELIN — Complete Setup & Run Guide

## What Was Fixed

### 1. Anti-Phishing Shield
- **Problem**: Module was using local JavaScript simulation instead of calling the backend API
- **Fix**: Rewrote `PhishingModule.tsx` to call `phishingApi.scanUrl()` for real-time backend analysis
- Added live backend status indicator (ONLINE / OFFLINE)
- Proper confidence score bar and prevention steps from API response

### 2. Deepfake Scanner
- **Problem**: TypeScript type mismatch — frontend expected `"authentic"/"manipulated"/"suspicious"` but backend returns `"Original"/"AI Generated"/"Manipulated"`
- **Fix**: Updated `DeepfakeResult` interface in `api.ts` to match backend output exactly
- Missing `import os` in `deepfake_detector.py` causing startup crash — fixed
- All three classifications now display properly with reasons and prevention steps

### 3. Backend / API Connectivity
- **Problem**: API URL hardcoded to `http://127.0.0.1:8000` — doesn't work in Capacitor mobile app
- **Fix**: Dynamic URL detection — uses Vite proxy in browser, direct IP in native mobile app
- Replaced MongoDB dependency with lightweight file-based JSON store (no database server needed)
- Removed `bcrypt` direct import, replaced with built-in `hashlib`
- Fixed `requirements.txt` to only include actually needed packages

### 4. Mobile (Android) Integration
- **Problem**: Cleartext HTTP blocked by Android; missing network permissions; wrong backend IP
- **Fix**: Added `android:usesCleartextTraffic="true"` to `AndroidManifest.xml`
- Added `network_security_config.xml` allowing HTTP to local dev IPs
- Added camera, storage, and media permissions
- Fixed `capacitor.config.ts` with proper `allowNavigation` list

---

## 🖥️ Step 1: Run the Backend

### Prerequisites
- Python 3.9 or higher
- `pip` available

### Install & Start
```bash
cd axiom-guard-main/backend

# Install dependencies
pip install -r requirements.txt

# Start the server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Or use the provided script:
```bash
# Mac/Linux
bash start_backend.sh

# Windows
start_backend.bat
```

**Verify it works:** Open http://localhost:8000/docs in your browser — you should see the FastAPI Swagger UI.

---

## 🌐 Step 2: Run the Web App (Browser)

```bash
cd axiom-guard-main

# Install Node dependencies (first time only)
npm install

# Start development server
npm run dev
```

Open http://localhost:8080 — the Vite proxy automatically routes `/api` calls to port 8000.

---

## 📱 Step 3: Build & Run on Android

### Prerequisites
- Android Studio installed
- Android SDK set up
- Node.js + npm
- Java 17+

### For Android Emulator (Recommended for testing)

```bash
cd axiom-guard-main

# 1. Build the React app
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android
```

Then in Android Studio: **Run > Run 'app'** (select your emulator).

The backend URL `10.0.2.2` is already configured — this is how Android Emulator reaches your host machine's `localhost`.

### For Real Android Device

1. Find your computer's LAN IP:
   - Windows: `ipconfig` → look for IPv4 address (e.g. `192.168.1.100`)
   - Mac/Linux: `ifconfig` → look for `inet` under `en0` or `wlan0`

2. Edit `capacitor.config.ts`:
   ```ts
   const BACKEND_HOST = '192.168.1.100'; // ← your actual LAN IP
   ```

3. Also update `src/services/api.ts`:
   ```ts
   const BACKEND_IP = '192.168.1.100'; // ← same IP
   ```

4. Rebuild and sync:
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

5. Enable USB debugging on your phone, connect it, and run from Android Studio.

---

## 🔍 Testing the Features

### Anti-Phishing Shield
- Safe URL: `https://google.com` → should show ✅ SAFE
- Suspicious: `http://paypal-secure-login.xyz` → should show 🚨 MALICIOUS
- Risk: `https://amazon-login.top` → should show ⚠️ SUSPICIOUS

### Deepfake Scanner
- Upload a real photograph → should show **Original** with low confidence
- Upload an AI-generated image (e.g., from Midjourney, DALL-E) → should show **AI Generated**
- Upload an edited/manipulated image → should show **Manipulated**
- The scanner uses multi-layer analysis: ELA, color distribution, noise patterns, frequency domain, and metadata

---

## ⚡ Quick Start (All-in-one)

Terminal 1:
```bash
cd axiom-guard-main/backend && pip install -r requirements.txt && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal 2:
```bash
cd axiom-guard-main && npm install && npm run dev
```

Open: http://localhost:8080
