import { registerPlugin, WebPlugin, type PermissionState, type PluginListenerHandle } from "@capacitor/core";

export interface GeofenceBridgePlugin {
  requestPermissions(): Promise<{ location: PermissionState; notifications: PermissionState }>;
  startMonitoring(options: { venues: Array<{ id: string; lat: number; lon: number; name?: string }> }): Promise<void>;
  stopMonitoring(): Promise<void>;
  openSettings(): Promise<void>;
  addListener(
    eventName: "regionEnter",
    listenerFunc: (event: { id: string; name?: string }) => void
  ): Promise<PluginListenerHandle>;
}

class GeofenceBridgeWeb extends WebPlugin implements GeofenceBridgePlugin {
  async requestPermissions() {
    return { location: "denied" as PermissionState, notifications: "denied" as PermissionState };
  }

  async startMonitoring(): Promise<void> {
    console.warn("GeofenceBridge: startMonitoring is only available on native platforms.");
  }

  async stopMonitoring(): Promise<void> {
    // no-op on web
  }

  async openSettings(): Promise<void> {
    // no-op on web
  }

  addListener(): Promise<PluginListenerHandle> {
    return Promise.resolve({
      remove: async () => undefined,
    });
  }
}

export const GeofenceBridge = registerPlugin<GeofenceBridgePlugin>("GeofenceBridge", {
  web: () => Promise.resolve(new GeofenceBridgeWeb()),
});

export type { PermissionState } from "@capacitor/core";
