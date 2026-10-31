/** The Firebase web config. Not secret: every browser that uses push gets it. */
export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
};

/** Read at request time (not build time), so one Docker image works with any Firebase project. */
export function getFirebaseWebConfig(): FirebaseWebConfig | null {
  const env = process.env;
  const config = {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID,
    vapidKey: env.FIREBASE_VAPID_KEY,
  };
  return Object.values(config).every(Boolean) ? (config as FirebaseWebConfig) : null;
}
