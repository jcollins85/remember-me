import { Capacitor } from "@capacitor/core";
import { FirebaseAnalytics as NativeFirebaseAnalytics } from "@capacitor-firebase/analytics";
import { logEvent } from "firebase/analytics";
import { getFirebaseAnalytics } from "../firebase";

export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

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

export const analytics = {
  trackEvent,
};
