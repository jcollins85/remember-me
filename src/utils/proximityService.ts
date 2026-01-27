/**
 * Proximity alert helper built on top of the local geofence bridge.
 */
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { PluginListenerHandle } from "@capacitor/core";
import { GeofenceBridge } from "../plugins/geofenceBridge";
import { Venue } from "../types";
import { isProximityAlertsEnabled } from "./proximityAlerts";
import { trackEvent } from "./analytics";

export type MonitoredVenue = Venue & {
  proximityMeta?: {
    totalPeople: number;
    favoriteNames: string[];
  };
};

const isNative = Capacitor.isNativePlatform();
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;
let regionListener: PluginListenerHandle | null = null;
const lastAlertTimestamps: Record<string, number> = {};
let venuesSnapshot: MonitoredVenue[] = [];

const getProximityNotificationId = (venueId: string) => {
  let hash = 0;
  for (let i = 0; i < venueId.length; i += 1) {
    hash = (hash * 31 + venueId.charCodeAt(i)) | 0;
  }
  return Math.max(1, Math.abs(hash));
};

// Builds the native/local notification payload for a venue and rate-limits per venue ID.
const scheduleNotification = async (venueId: string) => {
  const venue = venuesSnapshot.find((v) => v.id === venueId);
  if (!venue) return;
  const now = Date.now();
  if (lastAlertTimestamps[venueId] && now - lastAlertTimestamps[venueId] < ALERT_COOLDOWN_MS) {
    return;
  }
  const total = venue.proximityMeta?.totalPeople ?? 0;
  const favoriteNames = venue.proximityMeta?.favoriteNames ?? [];
  const totalText =
    total > 0
      ? `You know ${total} ${total === 1 ? "person" : "people"} here.`
      : "You haven't logged anyone here yet.";
  let favoriteText = "";
  if (favoriteNames.length > 0) {
    const preview = favoriteNames.slice(0, 2).join(", ");
    const remainder = favoriteNames.length - 2;
    favoriteText =
      favoriteNames.length > 2
        ? ` Favorites: ${preview} +${remainder} more.`
        : ` Favorites: ${preview}.`;
  }
  const venueLine = `You're near ${venue.name}.`;
  await LocalNotifications.schedule({
    notifications: [
      {
        title: "Nearby venue",
        body: `${venueLine} ${totalText}${favoriteText}`.trim(),
        id: getProximityNotificationId(venueId),
        extra: { venueId },
      },
    ],
  });
  lastAlertTimestamps[venueId] = now;
  trackEvent("proximity_notification_sent", {
    venue_id: venueId,
    total_people: total,
    favorite_count: favoriteNames.length,
  });
};

export const cancelProximityNotifications = async (venueIds: string[]) => {
  if (!isNative || venueIds.length === 0) return;
  try {
    await LocalNotifications.cancel({
      notifications: venueIds.map((venueId) => ({
        id: getProximityNotificationId(venueId),
      })),
    });
  } catch (error) {
    console.warn("Unable to cancel proximity notifications", error);
  }
};

// Only one listener can be active at a time – re-register whenever we restart monitoring.
const attachRegionListener = async () => {
  regionListener?.remove();
  regionListener = await GeofenceBridge.addListener("regionEnter", async (event) => {
    if (!isProximityAlertsEnabled()) return;
    trackEvent("proximity_region_enter", { venue_id: event.id });
    await scheduleNotification(event.id);
  });
};

// Requests the required permissions, subscribes to region events, and seeds the native geofences.
export const startProximityAlerts = async (venues: MonitoredVenue[]) => {
  venuesSnapshot = venues;
  if (!isNative) {
    return { ok: false, error: "Nearby venue alerts are only available on device." };
  }

  try {
    const permResult = await GeofenceBridge.requestPermissions();
    if (permResult.location !== "granted") {
      return { ok: false, error: "Location access is required to enable nearby venue alerts." };
    }

    if (permResult.notifications !== "granted") {
      const notifPerm = await LocalNotifications.requestPermissions();
      if (notifPerm.display !== "granted") {
        return { ok: false, error: "Notifications are disabled. Enable them in Settings." };
      }
    }

    await attachRegionListener();
    const venuesToMonitor = venues
      .filter((venue) => venue.coords && venue.proximityAlertsEnabled !== false)
      .map((venue) => ({
        id: venue.id,
        lat: venue.coords!.lat,
        lon: venue.coords!.lon,
        name: venue.name,
      }));
    await GeofenceBridge.startMonitoring({
      venues: venuesToMonitor,
    });
    return { ok: true };
  } catch (error: any) {
    console.warn("Unable to start proximity alerts", error);
    trackEvent("proximity_monitoring_error", {
      error_stage: "start",
      error_code: typeof error?.message === "string" ? error.message : "unknown",
    });
      return { ok: false, error: "Unable to start nearby venue alerts right now." };
  }
};

export const stopProximityAlerts = async () => {
  regionListener?.remove();
  regionListener = null;
  if (!isNative) return;
  try {
    await GeofenceBridge.stopMonitoring();
  } catch (error) {
    console.warn("Unable to stop geofence monitoring", error);
  }
};

// Called whenever coords or toggles change so the native layer always mirrors the latest data.
export const refreshMonitoredVenues = async (venues: MonitoredVenue[]) => {
  venuesSnapshot = venues;
  if (!isNative) return;
  try {
    const venuesToMonitor = venues
      .filter((venue) => venue.coords && venue.proximityAlertsEnabled !== false)
      .map((venue) => ({
        id: venue.id,
        lat: venue.coords!.lat,
        lon: venue.coords!.lon,
        name: venue.name,
      }));
    await GeofenceBridge.startMonitoring({
      venues: venuesToMonitor,
    });
  } catch (error: any) {
    console.warn("Unable to refresh geofence monitoring", error);
    trackEvent("proximity_monitoring_error", {
      error_stage: "refresh",
      error_code: typeof error?.message === "string" ? error.message : "unknown",
    });
  }
};
