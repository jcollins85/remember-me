import { registerPlugin } from '@capacitor/core';

import type { MapKitBridgePlugin } from './definitions';

const MapKitBridge = registerPlugin<MapKitBridgePlugin>('MapKitBridge', {
  web: () => import('./web').then((m) => new m.MapKitBridgeWeb()),
});

export * from './definitions';
export { MapKitBridge };
