import { Capacitor } from "@capacitor/core";
import { FirebaseAnalytics as NativeFirebaseAnalytics } from "@capacitor-firebase/analytics";
import { logEvent } from "firebase/analytics";
import { getFirebaseAnalytics } from "../firebase";

export type AnalyticsParams = Record<string, string | number | boolean | undefined>;
const firstEventCache = new Set<string>();

// Routes events to native Firebase on iOS, falling back to web analytics in the browser.
export const trackEvent = async (eventName: string, params?: AnalyticsParams) => {
  try {
    if (Capacitor.getPlatform() === "ios") {
      await NativeFirebaseAnalytics.logEvent({
        name: eventName,
        params,
      });
      return;
    }

    const analytics = await getFirebaseAnalytics();
    if (analytics) {
      logEvent(analytics, eventName, params);
    }
  } catch {
    // ignore analytics failures
  }
};

// Tracks an event once per device by persisting a key in localStorage.
export const trackFirstEvent = async (
  storageKey: string,
  eventName: string,
  params?: AnalyticsParams
) => {
  const key = `first_event_${storageKey}`;
  if (firstEventCache.has(key)) return;
  try {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem(key);
      if (stored === "true") {
        firstEventCache.add(key);
        return;
      }
      localStorage.setItem(key, "true");
    }
  } catch {
    // ignore storage failures
  }
  firstEventCache.add(key);
  await trackEvent(eventName, params);
};

export const analytics = {
  trackEvent,
  trackFirstEvent,
};
