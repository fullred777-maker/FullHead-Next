# FullHead Next environment isolation

This repository is restricted to the isolated testing environment.

## Required Vercel variables

Configure these variables only in the Vercel project connected to
`fullred777-maker/FullHead-Next`:

- `VITE_FULLHEAD_ENV=next-testing`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)
- `VITE_FIREBASE_VAPID_KEY` (optional; messaging is disabled for now)
- `FULLHEAD_ENV=next-testing`
- `FULLHEAD_ENABLE_COMMERCE=false`

The build refuses missing or inconsistent Firebase values and explicitly blocks
the known production Firebase project.

## Commercial integrations

The Hotmart/Resend endpoint returns 404 unless both
`FULLHEAD_ENV=production` and `FULLHEAD_ENABLE_COMMERCE=true`. Do not add
Hotmart or Resend secrets to the Next Vercel project.

## Firebase deployment

Do not create an active `.firebaserc` pointing at production. When the test
project is ready, deploy `firestore.rules` and `storage.rules` by selecting the
test project explicitly. Storage is denied by default because the current app
does not use it.
