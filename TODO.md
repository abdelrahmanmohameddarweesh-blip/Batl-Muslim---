# TODO - Batl Muslim (completion)

## 1) Firebase runtime setup (required)
- [ ] Replace placeholders in `src/firebase/config.ts` with real Firebase Web app config values.
- [ ] Confirm Firestore collection `users` exists (or allow auto-create on writes).

## 2) Verify app runs end-to-end
- [ ] Run `npm install`.
- [ ] Run `npm run start` and open Expo.
- [ ] Test: Login -> Home -> Trivia -> Leaderboard -> Profile.

## 3) Fix/complete Voice feature (feature completeness)
- [ ] Implement `src/screens/VoiceScreen.tsx` recording + playback using `expo-av` (or mark as finished with working UI).

## 4) Optional: improve ad resilience
- [ ] Ensure `src/components/AdBanner.tsx` doesn’t crash if ads fail (add safe fallback).

