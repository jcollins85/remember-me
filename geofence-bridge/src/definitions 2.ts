import type { PermissionState, PluginListenerHandle } from '@capacitor/core';

export interface GeofenceBridgePlugin {
  /**
   * Requests CoreLocation “Always” permission and notification permission.
   */
  requestPermissions(): Promise<{ location: PermissionState; notifications: PermissionState }>;

  /** Start monitoring the provided venue pins. */
  startMonitoring(options: { venues: Array<{ id: string; lat: number; lon: number; name?: string }> }): Promise<void>;

  /** Stop monitoring all regions. */
  stopMonitoring(): Promise<void>;

  /** Optional: open iOS Settings if permission denied. */
  openSettings(): Promise<void>;

  addListener(
    eventName: 'regionEnter',
    listenerFunc: (event: { id: string; name?: string }) => void,
  ): Promise<PluginListenerHandle>;
}
