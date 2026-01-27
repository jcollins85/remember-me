import React, { createContext, useContext } from "react";
import { analytics, AnalyticsParams } from "../utils/analytics";

interface AnalyticsContextValue {
  trackEvent: (eventName: string, params?: AnalyticsParams) => Promise<void>;
  trackFirstEvent: (storageKey: string, eventName: string, params?: AnalyticsParams) => Promise<void>;
}

// Default no-op keeps analytics optional without guarding every call site.
const AnalyticsContext = createContext<AnalyticsContextValue>({
  trackEvent: async () => {},
  trackFirstEvent: async () => {},
});

export const AnalyticsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => useContext(AnalyticsContext);
