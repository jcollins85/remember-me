import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { MapKitBridge } from "../../plugins/mapkitBridge";
import type { Venue } from "../../types";
import { useNotification } from "../../context/NotificationContext";
import { useAnalytics } from "../../context/AnalyticsContext";
import { triggerImpact, ImpactStyle } from "../../utils/haptics";

const mapPreviewPlaceholder =
  "data:image/svg+xml,%3Csvg width='640' height='360' viewBox='0 0 640 360' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='640' height='360' fill='%23f8f4ef'/%3E%3Cpath d='M0 40h640M0 120h640M0 200h640M0 280h640' stroke='%23e5dbcf' stroke-width='2'/%3E%3Cpath d='M80 0v360M200 0v360M320 0v360M440 0v360M560 0v360' stroke='%23e5dbcf' stroke-width='2'/%3E%3Cpath d='M0 260l80-40 60 30 100-50 90 60 90-80 120 40 100-70 0 210H0z' fill='%23d5e5f0'/%3E%3Cpath d='M0 300l90-60 120 70 120-70 120 50 190-140V360H0z' fill='%23c7e0da'/%3E%3C/svg%3E";

type PendingLocationPayload = {
  coords: { lat: number; lon: number } | null;
  locationTag: string;
  proximityEnabled: boolean;
};

interface LocationSectionProps {
  venueName: string;
  canUseLocation: boolean;
  labelClass: string;
  formError?: string;
  resolveVenue: () => Venue;
  getSelectedVenue: () => Venue | null;
  onValidationCoordsChange?: (coords: { lat: string; lon: string } | null) => void;
  onPendingChange?: (data: PendingLocationPayload | null) => void;
  globalProximityEnabled: boolean;
  onEnableGlobalProximity: () => void;
}

const defaultSearchPlaceholder = "Search by name or address";

type SearchResult = { name: string; address: string; lat: number; lng: number };

type PendingAction = (() => Promise<void>) | null;

  const LocationSection: React.FC<LocationSectionProps> = ({
    venueName,
    canUseLocation,
    labelClass,
    formError,
    resolveVenue,
    getSelectedVenue,
    onValidationCoordsChange,
    onPendingChange,
    globalProximityEnabled,
    onEnableGlobalProximity,
  }) => {
  const { showNotification } = useNotification();
  const { trackEvent } = useAnalytics();
  const initialVenue = useMemo(() => getSelectedVenue(), [getSelectedVenue]);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    initialVenue?.coords ?? null
  );
  const [locationTag, setLocationTag] = useState(initialVenue?.locationTag ?? "");
  const [venueProximityEnabled, setVenueProximityEnabled] = useState(() => {
    if (!globalProximityEnabled) return false;
    return initialVenue?.proximityAlertsEnabled !== false;
  });
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [mapSnapshot, setMapSnapshot] = useState<string | null>(null);
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceVenue, setReplaceVenue] = useState<Venue | null>(null);
  const [pendingReplaceAction, setPendingReplaceAction] = useState<PendingAction>(null);
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<SearchResult[]>([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [searchPlaceholder, setSearchPlaceholder] = useState(defaultSearchPlaceholder);
  const [showGlobalProximityModal, setShowGlobalProximityModal] = useState(false);

  useEffect(() => {
    if (!onValidationCoordsChange) return;
    if (coords) {
      onValidationCoordsChange({ lat: coords.lat.toFixed(4), lon: coords.lon.toFixed(4) });
    } else {
      onValidationCoordsChange(null);
    }
  }, [coords, onValidationCoordsChange]);

  useEffect(() => {
    if (!canUseLocation) {
      onPendingChange?.(null);
      return;
    }
    onPendingChange?.({
      coords,
      locationTag,
      proximityEnabled: venueProximityEnabled,
    });
  }, [coords, locationTag, venueProximityEnabled, canUseLocation, onPendingChange]);

  useEffect(() => {
    if (!venueName.trim()) {
      setVenueProximityEnabled(globalProximityEnabled);
      return;
    }
    const existing = getSelectedVenue();
    if (existing) {
      if (globalProximityEnabled) {
        setVenueProximityEnabled(existing.proximityAlertsEnabled !== false);
      } else {
        setVenueProximityEnabled(false);
      }
    } else {
      setVenueProximityEnabled(globalProximityEnabled);
    }
  }, [venueName, getSelectedVenue, globalProximityEnabled]);

  useEffect(() => {
    const typed = venueName.trim();
    if (!typed) {
      setCoords(null);
      setLocationTag("");
      setMapSnapshot(null);
      setSnapshotError(null);
      return;
    }
    const existing = getSelectedVenue();
    if (!existing) {
      return;
    }
    if (!existing.coords) {
      setCoords(null);
      return;
    }
    const sameCoords =
      coords &&
      Math.abs(coords.lat - existing.coords.lat) < 0.000001 &&
      Math.abs(coords.lon - existing.coords.lon) < 0.000001;
    if (!sameCoords) {
      setCoords({ lat: existing.coords.lat, lon: existing.coords.lon });
    }
    if (existing.locationTag && existing.locationTag !== locationTag) {
      setLocationTag(existing.locationTag);
    }
  }, [venueName, coords, locationTag, getSelectedVenue]);

  useEffect(() => {
    let cancelled = false;

    if (!coords) {
      setMapSnapshot(null);
      setSnapshotError(null);
      setIsSnapshotLoading(false);
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      setMapSnapshot(null);
      setSnapshotError("Preview available on device");
      return;
    }

    const fetchSnapshot = async () => {
      const venueLabel = venueName.trim() || "unspecified";
      try {
        setIsSnapshotLoading(true);
        const result = await MapKitBridge.getSnapshot({
          lat: coords.lat,
          lng: coords.lon,
          width: 640,
          height: 288,
          spanMeters: 800,
        });
        if (!cancelled) {
          const newLabel = result.address || `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`;
          setMapSnapshot(`data:image/png;base64,${result.imageData}`);
          setSnapshotError(null);
          trackEvent("map_snapshot_success", {
            venueName: venueLabel,
            hasAddress: Boolean(result.address),
          });
          if (newLabel !== locationTag) {
            setLocationTag(newLabel);
          }
        }
      } catch (error: any) {
        console.warn("Map snapshot error", error);
        if (!cancelled) {
          setMapSnapshot(null);
          setSnapshotError("Preview unavailable");
        }
        trackEvent("map_snapshot_error", {
          venueName: venueName.trim() || "unspecified",
          message: typeof error?.message === "string" ? error.message : "unknown",
        });
      } finally {
        if (!cancelled) {
          setIsSnapshotLoading(false);
        }
      }
    };

    fetchSnapshot();
    return () => {
      cancelled = true;
    };
  }, [coords, venueName, trackEvent]);

  useEffect(() => {
    if (showPlaceSearch) {
      const currentVenueName = venueName.trim();
      if (currentVenueName) {
        setSearchPlaceholder(`Search (e.g. ${currentVenueName})`);
      } else {
        setSearchPlaceholder(defaultSearchPlaceholder);
      }
    }
    if (!showPlaceSearch) {
      setPlaceQuery("");
      setPlaceResults([]);
      setPlaceLoading(false);
      setPlaceError(null);
      return;
    }
    const trimmed = placeQuery.trim();
    if (trimmed.length < 2 || !Capacitor.isNativePlatform()) {
      setPlaceResults([]);
      setPlaceLoading(false);
      return;
    }
    let cancelled = false;
    const handler = window.setTimeout(async () => {
      try {
        setPlaceLoading(true);
        setPlaceError(null);
        const { results } = await MapKitBridge.searchPlaces({
          query: trimmed,
          near: coords ? { lat: coords.lat, lng: coords.lon } : undefined,
        });
        if (!cancelled) {
          setPlaceResults(results);
          trackEvent("place_search_results", {
            query_length: trimmed.length,
            result_count: results.length,
          });
        }
      } catch (error: any) {
        console.warn("Place search error", error);
        if (!cancelled) {
          setPlaceError("Couldn't search right now");
        }
        trackEvent("place_search_error", {
          message: typeof error?.message === "string" ? error.message : "unknown",
        });
      } finally {
        if (!cancelled) {
          setPlaceLoading(false);
        }
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handler);
    };
  }, [placeQuery, showPlaceSearch, coords, venueName, trackEvent]);

  useEffect(() => {
    if (!showPlaceSearch) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showPlaceSearch]);

  const ensureLocationPermission = async () => {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    try {
      const perm = (await Geolocation.requestPermissions()) as {
        location?: "granted" | "denied" | "grantedWhenInUse";
      } | void;
      if (perm?.location === "granted" || perm?.location === "grantedWhenInUse") {
        return true;
      }
      showNotification(
        "Enable location access for MetHere in Settings to capture venue pins.",
        "info"
      );
      return false;
    } catch (error) {
      console.warn("Permission request error", error);
      showNotification("Unable to request location permission right now.", "error");
      return false;
    }
  };

  const getCurrentCoordinates = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
        });
        return {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
      }
    } catch (nativeError) {
      console.warn("Native geolocation error", nativeError);
      throw nativeError;
    }
    if (!navigator.geolocation) {
      throw new Error("Geolocation not supported on this device.");
    }
    return new Promise<{ lat: number; lon: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => reject(err),
        { enableHighAccuracy: true }
      );
    });
  };

  const runCurrentCapture = async (coordsPayload: { lat: number; lon: number }) => {
    setCoords(coordsPayload);
    const autoLabel = `${coordsPayload.lat.toFixed(4)}, ${coordsPayload.lon.toFixed(4)}`;
    setLocationTag((prev) => prev || autoLabel);
    showNotification("Location captured", "info");
  };

  const maybeConfirmReplace = (
    nextCoords: { lat: number; lon: number } | null,
    action: () => Promise<void>
  ) => {
    const venueRecord = getSelectedVenue();
    if (venueRecord?.coords) {
      if (
        nextCoords &&
        Math.abs(venueRecord.coords.lat - nextCoords.lat) < 0.0005 &&
        Math.abs(venueRecord.coords.lon - nextCoords.lon) < 0.0005
      ) {
        return false;
      }
      setReplaceVenue(venueRecord);
      setPendingReplaceAction(() => action);
      setShowReplaceModal(true);
      return true;
    }
    return false;
  };

  const captureCurrentLocation = async () => {
    try {
      setIsCapturingLocation(true);
      const allowed = await ensureLocationPermission();
      if (!allowed) {
        return;
      }
      const coordsPayload = await getCurrentCoordinates();
      const action = () => runCurrentCapture(coordsPayload);
      if (maybeConfirmReplace(coordsPayload, action)) {
        return;
      }
      await action();
      trackEvent("venue_pin_captured", { source: "current_location", venueName: venueName });
    } catch (error: any) {
      console.warn("Location capture error", error);
      const message =
        (typeof error?.message === "string" && error.message) ||
        "Couldn't access your location.";
      showNotification(message, "error");
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const handlePlaceSelect = (place: { name: string; address: string; lat: number; lng: number }) => {
    setShowPlaceSearch(false);
    setPlaceQuery("");
    setPlaceResults([]);
    const coordsPayload = { lat: place.lat, lon: place.lng };
    const action = () => {
      setCoords(coordsPayload);
      setLocationTag(place.address);
      showNotification(`Location set to ${place.name}`, "info");
      trackEvent("venue_pin_captured", { source: "search", venueName: venueName });
      trackEvent("place_selected", { venueName, placeName: place.name });
      return Promise.resolve();
    };
    if (maybeConfirmReplace(coordsPayload, action)) {
      return;
    }
    action();
  };

  const toggleVenueProximityAlerts = () => {
    const next = !venueProximityEnabled;
    if (!next) {
      setVenueProximityEnabled(false);
      return;
    }
    if (!globalProximityEnabled) {
      setShowGlobalProximityModal(true);
      return;
    }
    setVenueProximityEnabled(true);
  };

  const handleReplaceConfirm = async () => {
    setShowReplaceModal(false);
    setReplaceVenue(null);
    const action = pendingReplaceAction;
    setPendingReplaceAction(null);
    if (action) {
      await action();
    }
  };

  const handleReplaceCancel = () => {
    setShowReplaceModal(false);
    setReplaceVenue(null);
    setPendingReplaceAction(null);
  };

  return (
    <>
      <AnimatePresence mode="sync">
        {canUseLocation && (
          <motion.section
            key="location-section"
            layout
            layoutId="location-section"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
            className="mt-1.5 space-y-4 will-change-transform"
          >
            <div>
              <p className={labelClass.replace("mb-2", "")}>Location</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Add a map pin for this venue.
              </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!Capacitor.isNativePlatform()) {
                  showNotification("Search is available on device only.", "info");
                  return;
                }
                trackEvent("place_search_opened", {
                  venueName: venueName.trim() || "unspecified",
                });
                setShowPlaceSearch(true);
              }}
              className="rounded-full bg-[var(--color-accent)] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:brightness-110 disabled:opacity-60"
            >
              Choose a place
            </button>
            <button
              type="button"
              onClick={() => {
                triggerImpact(ImpactStyle.Light);
                captureCurrentLocation();
              }}
              disabled={isCapturingLocation}
              className="rounded-full border border-white/40 bg-[var(--color-card)] px-4 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
            >
              {isCapturingLocation ? "Capturing…" : "Use current location"}
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {coords ? (
              <motion.div
                key="map-card"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-4 rounded-[30px] border border-[var(--color-card-border)] bg-[var(--color-card)]/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.15)]"
              >
                <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-[var(--color-card)]/60">
                  <img
                    src={mapSnapshot ?? mapPreviewPlaceholder}
                    alt="Map preview"
                    className="h-48 w-full object-cover transition-opacity"
                  />
                  {!mapSnapshot && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                        <div className="h-6 w-6 rounded-full bg-[var(--color-accent)] shadow-lg" />
                      </div>
                    </div>
                  )}
                  {isSnapshotLoading && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--color-card)]/50 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Generating preview…
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-base font-semibold text-[var(--color-text-primary)]">
                    {venueName.trim() || "The Broadview Rooftop"}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {locationTag || `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const text =
                        locationTag?.trim() || `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`;
                      navigator.clipboard
                        ?.writeText(text)
                        .then(() => showNotification("Coordinates copied", "info"))
                        .catch(() => showNotification("Unable to copy coordinates.", "error"));
                      trackEvent("copy_address_clicked", {
                        venueName,
                        hasAddress: Boolean(locationTag),
                      });
                    }}
                    className="rounded-full border border-[var(--color-card-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text-primary)] shadow-[0_3px_10px_rgba(15,23,42,0.08)]"
                  >
                    Copy address
                  </button>
                  <button
                    type="button"
                    disabled={!coords}
                    onClick={() => {
                      if (coords) {
                        if (Capacitor.isNativePlatform()) {
                          window.open(`maps://?ll=${coords.lat},${coords.lon}`, "_blank");
                        } else {
                          window.open(`https://maps.google.com/?q=${coords.lat},${coords.lon}`, "_blank");
                        }
                        trackEvent("open_in_maps_clicked", { venueName });
                      }
                    }}
                    className="rounded-full border border-[var(--color-card-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text-primary)] shadow-[0_3px_10px_rgba(15,23,42,0.08)]"
                  >
                    Open in Maps
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {coords && (
            <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)]/80 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Nearby venue alert
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Notify me when I’m near this venue.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerImpact(ImpactStyle.Light);
                  toggleVenueProximityAlerts();
                }}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition ${
                  venueProximityEnabled ? "bg-[var(--color-accent)]" : "bg-[var(--color-card-border)]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    venueProximityEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}

            {formError && <p className="text-red-500 text-xs">{formError}</p>}
          </motion.section>
        )}
      </AnimatePresence>

      {showReplaceModal && replaceVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-[32px] bg-[var(--color-card)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.4)] text-center space-y-4"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Replace saved pin?
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                “{replaceVenue.name}” already has a location. Replacing it will update the pin for everyone linked to this venue.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleReplaceCancel}
                className="rounded-full border border-[var(--color-card-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-card)]/80"
              >
                Keep existing
              </button>
              <button
                type="button"
                onClick={handleReplaceConfirm}
                className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,0,0,0.25)] hover:brightness-110"
              >
                Replace location
              </button>
            </div>
          </div>
        </div>
      )}

      {showGlobalProximityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-[32px] bg-[var(--color-card)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.4)] text-center space-y-4"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Enable nearby venue alerts?
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Turn on global alerts so this venue can notify you when you’re nearby.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setShowGlobalProximityModal(false)}
                className="rounded-full border border-[var(--color-card-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-card)]/80"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGlobalProximityModal(false);
                  onEnableGlobalProximity();
                  setVenueProximityEnabled(true);
                }}
                className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,0,0,0.25)] hover:brightness-110"
              >
                Enable alerts
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlaceSearch && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none bg-[var(--color-card)]/50 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            className="pointer-events-auto w-[min(80vw,380px)] rounded-[30px] bg-white p-5 shadow-[0_25px_60px_rgba(15,23,42,0.45)] space-y-4 max-h-[80vh] flex flex-col border border-black/5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Search by name or address
              </p>
              <button
                type="button"
                onClick={() => setShowPlaceSearch(false)}
                className="text-lg font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
              >
                ×
              </button>
            </div>
            <div className="rounded-[26px] border border-black/10 bg-white px-4 py-2 flex items-center gap-3 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]">
              <span className="text-[var(--color-text-secondary)]">⌕</span>
              <input
                type="text"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-base text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
                autoFocus
              />
            </div>
            <div className="max-h-[55vh] overflow-y-auto pr-1 flex-1 bg-white rounded-[20px] px-2 py-2 space-y-1">
              {placeLoading && (
                <p className="text-xs text-[var(--color-text-secondary)] px-1">Searching…</p>
              )}
              {placeError && (
                <p className="text-xs text-red-500 px-1">{placeError}</p>
              )}
              {!placeLoading && !placeError && placeResults.length === 0 && placeQuery.trim().length >= 2 && (
                <p className="text-xs text-[var(--color-text-secondary)] px-1">No matches found.</p>
              )}
              {!placeLoading &&
                !placeError &&
                placeResults.slice(0, 5).map((place) => (
                  <button
                    key={`${place.lat}-${place.lng}-${place.address}`}
                    type="button"
                    onClick={() => handlePlaceSelect(place)}
                    className="w-full text-left rounded-[18px] border border-black/5 bg-white px-3 py-2 shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:bg-[var(--color-card)]/30 transition"
                  >
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{place.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{place.address}</p>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LocationSection;
