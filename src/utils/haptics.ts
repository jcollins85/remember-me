import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const isNative = Capacitor.isNativePlatform();
const canVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;

let hapticsEnabled = true;
const storageKey = "rememberme:haptics-enabled";

const loadPreference = () => {
  if (typeof window === "undefined") return;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored !== null) {
      hapticsEnabled = stored === "true";
    }
  } catch (error) {
    console.warn("Unable to read haptics preference", error);
  }
};

loadPreference();

export const isHapticsEnabled = () => hapticsEnabled;

export const setHapticsEnabled = (enabled: boolean) => {
  hapticsEnabled = enabled;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(storageKey, String(enabled));
    } catch (error) {
      console.warn("Unable to persist haptics preference", error);
    }
  }
};

const tryNativeImpact = async (cb: () => Promise<void>) => {
  if (!isNative) return false;
  try {
    await cb();
    return true;
  } catch (error) {
    console.warn("Native haptics failed", error);
    return false;
  }
};

const webFallback = (duration = 20) => {
  if (!canVibrate) return;
  navigator.vibrate(duration);
};

export const triggerImpact = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (!hapticsEnabled) return;
  const handled = await tryNativeImpact(() => Haptics.impact({ style }));
  if (!handled) webFallback();
};

export const triggerSelection = async () => {
  if (!hapticsEnabled) return;
  const handled = await tryNativeImpact(() => Haptics.selectionChanged());
  if (!handled) webFallback(10);
};

export { ImpactStyle } from "@capacitor/haptics";
