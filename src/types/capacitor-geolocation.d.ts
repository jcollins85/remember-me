declare module "@capacitor/geolocation" {
  export interface PositionOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }

  export interface WatchPositionOptions extends PositionOptions {
    distanceFilter?: number;
  }

  export interface GeolocationPosition {
    coords: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      altitude?: number | null;
      altitudeAccuracy?: number | null;
      heading?: number | null;
      speed?: number | null;
    };
    timestamp: number;
  }

  export const Geolocation: {
    requestPermissions: () => Promise<void>;
    getCurrentPosition: (options?: PositionOptions) => Promise<GeolocationPosition>;
    watchPosition: (
      options: WatchPositionOptions,
      callback: (position: GeolocationPosition | null, error?: any) => void
    ) => Promise<string>;
    clearWatch: (options: { id: string }) => Promise<void>;
  };
}
