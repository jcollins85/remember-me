import React, { createContext, useContext } from "react";
import { analytics, AnalyticsParams } from "../utils/analytics";

interface AnalyticsContextValue {
  trackEvent: (eventName: string, params?: AnalyticsParams) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  trackEvent: async () => {},
});

export const AnalyticsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => useContext(AnalyticsContext);
