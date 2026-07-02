# بطل مسلم (Batl Muslim)

Welcome — starter scaffold for the `بطل مسلم` mobile app.

## Overview
React Native (Expo) + TypeScript starter. Firebase and AdMob integration placeholders included.

## Quick start

1. Install dependencies

```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm install
```

2. Start Expo

```bash
export PATH="$HOME/.local/node/bin:$PATH"
export CHOKIDAR_USEPOLLING=true
export CHOKIDAR_INTERVAL=1000
npm run start
```

3. Open the Expo browser dashboard

Open in your browser:

```bash
http://localhost:19002
# or
http://127.0.0.1:19002
```

4. Configure Firebase

- Replace `src/firebase/config.ts` with your Firebase project's config.

4. Run on simulator or device

```bash
npm run android
npm run ios
```

## Notes
- Add your AdMob IDs in `src/config/ads.ts` (placeholder)
- Replace `src/firebase/config.ts` with your Firebase credentials.
- Voice recording uses `expo-av` audio APIs (stubbed)

## Firebase setup

1. Create a Firebase project.
2. Enable Authentication (Anonymous or Email).
3. Enable Firestore database.
4. Copy config values into `src/firebase/config.ts`.

## AdMob setup

1. Create AdMob ad units for banner, interstitial, and rewarded.
2. Replace `AdMobConfig` values in `src/config/ads.ts`.
3. Use test ad unit IDs while developing.

