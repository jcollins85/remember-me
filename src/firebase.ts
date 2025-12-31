import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCqXy7dPQjWHNwY6bU00qwFF_QbNsAGyHA",
  authDomain: "eraone-methere.firebaseapp.com",
  projectId: "eraone-methere",
  storageBucket: "eraone-methere.firebasestorage.app",
  messagingSenderId: "149505713742",
  appId: "1:149505713742:web:00d963c3d4057f4700451f",
  measurementId: "G-3Q93SD72N4",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app); // Initialize Analytics

// Log a simple test event
logEvent(analytics, 'app_started'); // This will send an event named 'app_started'

console.log("Firebase Auth initialized:", auth);
console.log("Firebase Analytics initialized:", analytics);

let analyticsPromise: Promise<ReturnType<typeof getAnalytics> | null> | null = null;

export const getFirebaseAnalytics = () => {
  if (!analyticsPromise) {
    analyticsPromise = isSupported().then((supported) => (supported ? getAnalytics(app) : null));
  }
  return analyticsPromise;
};

export { app, auth };
