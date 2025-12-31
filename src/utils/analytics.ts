import { getFirebaseAnalytics } from "../firebase";
import { logEvent } from "firebase/analytics";

export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

export const trackEvent = async (eventName: string, params?: AnalyticsParams) => {
  try {
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
