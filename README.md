# Apli PMPML — Production PWA & Git Deployment

Official mobile application for Pune Mahanagar Parivahan Mahamandal Limited (PMPML), providing commuters with real-time bus tracking, digital ticket booking, and route planning across Pune and Pimpri-Chinchwad.

## Project Details
- **Application Name**: Apli PMPML
- **Short Name**: Apli PMPML
- **Theme Color**: `#FFFAFA`
- **Background Color**: `#FFFAFA`
- **Production Domain**: [https://aplipmpml.com](https://aplipmpml.com)
- **GitHub Repository**: [https://github.com/navoday-kopawar/apli-pmpml.git](https://github.com/navoday-kopawar/apli-pmpml.git)
- **Production Branch**: `main`

---

## Architecture & Features

### 1. Progressive Web App (PWA)
- **Manifest**: Web App Manifest ([manifest.json](manifest.json)) configured for standalone display mode, theme `#FFFAFA`, and responsive PMPML icons.
- **Icons**: 192x192, 512x512, and 512x512 maskable icons in [icons/](icons/).
- **iOS / Safari Support**: Native Apple web app tags and touch icons included.
- **Offline Support**: Cached application shell with offline fallback ([offline.html](offline.html)).

### 2. Automatic Build & Versioning System
- Running `npm run build` (or automated CI/CD) generates a unique build version timestamp in `version.json` and updates `CACHE_NAME` in `service-worker.js`.
- Eliminates manual cache version management.

### 3. Automatic PWA Update System
- `pwa-app.js` continuously monitors `version.json` from the network.
- When a new deployment is pushed to `main`, the client detects the new version and triggers `registration.update()`.
- Users see a clean, non-intrusive banner: **"New Version Available [Update Now]"**.
- Clicking **Update Now** activates the new service worker, clears obsolete caches, and reloads the app to present the latest production build without requiring manual cache clearing or app reinstallation.

---

## Local Development & Commands

### Prerequisites
- Node.js (v18+)

### Development Server
Start local static server:
```bash
npm start
```

### Production Build & Version Update
To manually run the automated versioning build:
```bash
npm run build
```

---

## Git & Production Deployment Workflow

Whenever you modify source code (HTML, CSS, JS, images, routes, features):

1. **Check Status**:
   ```bash
   git status
   ```
2. **Stage Changes**:
   ```bash
   git add .
   ```
3. **Commit Changes**:
   ```bash
   git commit -m "Update bus tracking and route timetables"
   ```
4. **Push to Production Branch**:
   ```bash
   git push origin main
   ```

### What Happens After `git push origin main`?
```text
GIT PUSH TO MAIN
       ↓
GITHUB DEPLOYMENT TRIGGERED
       ↓
AUTOMATED BUILD RUNS (npm run build)
       ↓
NEW VERSION & SW CACHE_NAME GENERATED
       ↓
PRODUCTION DEPLOYMENT (aplipmpml.com)
       ↓
INSTALLED PWA DETECTS VERSION CHANGE
       ↓
NEW SERVICE WORKER DOWNLOADS ASSETS
       ↓
USER SELECTS "UPDATE NOW"
       ↓
LATEST VERSION LOADED (ZERO MANUAL CACHE CLEARING)
```

---

## Offline & Real-Time Data Strategy
- **Cached Offline**: App shell, static CSS, JavaScript, logos, icons, timetable layouts, and help pages.
- **Network-Only (Live Data)**: Live bus tracking, ticket booking transactions, payment gateways, and authentication endpoints bypass cache to ensure real-time accuracy.
