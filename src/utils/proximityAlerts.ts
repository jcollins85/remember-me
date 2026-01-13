// Tiny helper that tracks whether the user wants global proximity monitoring enabled.
const storageKey = "rememberme:proximity-alerts-enabled";

let proximityEnabled = false;

const loadPreference = () => {
  if (typeof window === "undefined") return;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored !== null) {
      proximityEnabled = stored === "true";
    }
  } catch (error) {
    console.warn("Unable to read proximity preference", error);
  }
};

loadPreference();

export const isProximityAlertsEnabled = () => proximityEnabled;

export const setProximityAlertsEnabled = (enabled: boolean) => {
  proximityEnabled = enabled;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(storageKey, String(enabled));
    } catch (error) {
      console.warn("Unable to persist proximity preference", error);
    }
  }
};

// Keep radius centralized so we can tweak sensitivity without touching native bridge wiring.
export const PROXIMITY_RADIUS_METERS = 100;
