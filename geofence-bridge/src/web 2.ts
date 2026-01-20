import { WebPlugin } from '@capacitor/core';

import type { GeofenceBridgePlugin } from './definitions';

export class GeofenceBridgeWeb extends WebPlugin implements GeofenceBridgePlugin {
  async requestPermissions() {
    return { location: 'denied' as const, notifications: 'denied' as const };
  }

  async startMonitoring(): Promise<void> {
    console.warn('GeofenceBridge: startMonitoring is only available on native platforms.');
  }

  async stopMonitoring(): Promise<void> {
    // no-op
  }

  async openSettings(): Promise<void> {
    // no-op
  }

  addListener(): any {
    return { remove: () => undefined };
  }
}
