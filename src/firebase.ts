import { initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const missingConfig = Object.entries(firebaseConfig).filter(([, value]) => !value);

if (missingConfig.length) {
  console.warn(
    `Firebase configuration is incomplete: ${missingConfig
      .map(([key]) => key)
      .join(", ")}. Check your environment variables.`
  );
}

let app: FirebaseApp | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

if (!missingConfig.length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  console.warn(
    "Firebase config missing. Analytics disabled until VITE_FIREBASE_* env vars are provided."
  );
}

let bootAnalytics: Analytics | null = null;

if (app && typeof window !== "undefined") {
  try {
    bootAnalytics = getAnalytics(app);
    logEvent(bootAnalytics, "app_started");
    console.log("Firebase Auth initialized:", auth);
    console.log("Firebase Analytics initialized:", bootAnalytics);
  } catch (error) {
    console.warn("Unable to initialize Firebase Analytics immediately", error);
  }
}

let analyticsPromise: Promise<Analytics | null> | null = null;

export const getFirebaseAnalytics = () => {
  if (!app) {
    return Promise.resolve(null);
  }

  if (!analyticsPromise) {
    analyticsPromise = isSupported().then((supported) => {
      if (!supported) return null;
      if (bootAnalytics) return bootAnalytics;
      return getAnalytics(app!);
    });
  }
  return analyticsPromise;
};

export { app, auth };
