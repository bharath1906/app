# MathLens Web App

A web-based app that scans math puzzles with three bubbles using camera, OCR, and overlays numbers based on mode.

## Features
- Real-time camera scanning
- OCR with Tesseract.js
- Bubble detection with OpenCV.js
- Math evaluation with math.js
- AR overlay on live feed
- Offline-capable (models cached)
- Mobile installable via Capacitor

## Setup
1. Clone/download the `mathlens-web` folder.
2. Install dependencies: `npm install`
3. Run locally: `npm start`
4. Open in browser at http://localhost:3000

## Building for Mobile
1. Install Capacitor: `npm install @capacitor/cli @capacitor/android`
2. Add Android: `npx cap add android`
3. Sync: `npm run cap`
4. Open in Android Studio: `npx cap open android`
5. Build APK.

## Online Build
- **Netlify**: Upload the `mathlens-web` folder, set publish directory to root (or use `netlify.toml`).
- **Vercel**: Upload the `mathlens-web` folder, it auto-deploys using `vercel.json`.
- For mobile, use Capacitor locally or CI.

## Usage
- Select mode (lowest/highest to lowest).
- Point camera at math puzzle with 3 bubbles.
- Numbers 1,2,3 overlay on bubbles in sorted order.