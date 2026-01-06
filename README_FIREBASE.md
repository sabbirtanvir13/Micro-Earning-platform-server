Firebase Admin setup
====================

To verify Firebase ID tokens on the server and avoid 500 errors from `/api/auth/verify-firebase`, you must provide Firebase Admin credentials to the backend.

Options (choose one):

1) serviceAccountKey.json (recommended for local development)

- In Firebase Console → Project Settings → Service accounts → Generate new private key.
- Save the downloaded JSON as `server/serviceAccountKey.json` (NO quotes, exact JSON).
- Make sure `server/.gitignore` contains `server/serviceAccountKey.json` so you don't commit it.
- Restart the backend: `cd server && npm run dev`.

2) Environment variables (CI / production friendly)

- Add the following to `server/.env` (wrap the private key and replace newlines with `\n`):

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
```

- Restart the backend after updating `.env`.

Verification
------------
- After providing credentials, start the server and check logs. You should see either:

  - "Firebase Admin initialized from serviceAccountKey.json" or
  - "Firebase Admin initialized from environment variables"

- The client sign-in flow (`Sign in with Google`) should no longer get a 500 from `/api/auth/verify-firebase`.

If you want, paste the first 6 and last 6 characters of your `FIREBASE_PRIVATE_KEY` (NOT the whole key) and I can confirm your `.env` entry formatting is correct.
