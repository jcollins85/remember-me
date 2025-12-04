declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

let analyticsInitialized = false;

const injectScript = (measurementId: string) => {
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
};

export function initAnalytics(measurementId?: string) {
  if (typeof window === "undefined") return;
  if (!measurementId || analyticsInitialized) return;

  analyticsInitialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function (...args: unknown[]) {
      window.dataLayer?.push(args as unknown as Record<string, unknown>);
    };

  injectScript(measurementId);
  window.gtag("js", new Date());
  window.gtag("config", measurementId);
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !analyticsInitialized) return;
  window.gtag?.("event", eventName, params);
}
