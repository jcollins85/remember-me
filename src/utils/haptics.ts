import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const isNative = Capacitor.isNativePlatform();
const canVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;

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
  const handled = await tryNativeImpact(() => Haptics.impact({ style }));
  if (!handled) webFallback();
};

export const triggerSelection = async () => {
  const handled = await tryNativeImpact(() => Haptics.selectionChanged());
  if (!handled) webFallback(10);
};

export { ImpactStyle } from "@capacitor/haptics";
