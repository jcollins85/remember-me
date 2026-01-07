/**
 * Lightweight proximity alert helper for the mobile build.
 * Keeps the app-side logic clean by centralising permission checks,
 * background geolocation wiring, and local notifications.
 */
import { Capacitor } from "@capacitor/core";
import type {
  BackgroundGeolocationPlugin,
  WatcherOptions,
  Location,
  CallbackError,
} from "@capacitor-community/background-geolocation";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Venue } from "../types";
import { isProximityAlertsEnabled } from "./proximityAlerts";

const backgroundGeolocation = (Capacitor as any).Plugins
  ?.BackgroundGeolocation as BackgroundGeolocationPlugin | undefined;
const isNative = Capacitor.isNativePlatform() && Boolean(backgroundGeolocation);

const PROXIMITY_RADIUS_METERS = 100;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

let watcherId: string | null = null;
let venuesSnapshot: Venue[] = [];
const lastAlertTimestamps: Record<string, number> = {};

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371000 * c;
};

const notifyNearVenue = async (venue: Venue) => {
  const now = Date.now();
  if (lastAlertTimestamps[venue.id] && now - lastAlertTimestamps[venue.id] < ALERT_COOLDOWN_MS) {
    return;
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        title: "Nearby venue",
        body: `You're near ${venue.name}`,
        id: Number.parseInt(venue.id.replace(/\D/g, "").slice(-6), 10) || Date.now(),
      },
    ],
  });

  lastAlertTimestamps[venue.id] = now;
};

const createWatcher = async () => {
  if (!backgroundGeolocation) {
    throw new Error("Background geolocation not available.");
  }

  const options: WatcherOptions = {
    backgroundMessage: "We use your location to alert you when you're near saved venues.",
    backgroundTitle: "Proximity Alerts",
    distanceFilter: 50,
    requestPermissions: true,
    stale: false,
  };

  watcherId = await backgroundGeolocation.addWatcher(options, (location: Location | undefined, error?: CallbackError) => {
    if (error || !location?.latitude || !location?.longitude) {
      return;
    }

    if (!isProximityAlertsEnabled()) {
      return;
    }

    const { latitude, longitude } = location;
    venuesSnapshot.forEach((venue) => {
      if (!venue.coords || venue.proximityAlertsEnabled === false) return;
      const distance = getDistanceMeters(latitude, longitude, venue.coords.lat, venue.coords.lon);
      if (distance <= PROXIMITY_RADIUS_METERS) {
        notifyNearVenue(venue);
      }
    });
  });
};

export const startProximityAlerts = async (venues: Venue[]) => {
  venuesSnapshot = venues;
  if (!isNative) {
    return { ok: false, error: "Proximity alerts are only available on the app." };
  }

  try {
    const notifPerm = await LocalNotifications.requestPermissions();
    if (notifPerm.display !== "granted") {
      return { ok: false, error: "Notifications are disabled. Enable them in Settings." };
    }

    if (watcherId && backgroundGeolocation) {
      await backgroundGeolocation.removeWatcher({ id: watcherId });
      watcherId = null;
    }

    await createWatcher();
    return { ok: true };
  } catch (error) {
    console.warn("Unable to start proximity alerts", error);
    return { ok: false, error: "Unable to start proximity alerts right now." };
  }
};

export const stopProximityAlerts = async () => {
  if (!isNative) return;
  if (watcherId && backgroundGeolocation) {
    await backgroundGeolocation.removeWatcher({ id: watcherId });
    watcherId = null;
  }
};

export const refreshMonitoredVenues = (venues: Venue[]) => {
  venuesSnapshot = venues;
};
