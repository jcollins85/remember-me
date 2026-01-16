import { registerPlugin } from '@capacitor/core';

import type { GeofenceBridgePlugin } from './definitions';

const GeofenceBridge = registerPlugin<GeofenceBridgePlugin>('GeofenceBridge', {
  web: () => import('./web').then((m) => new m.GeofenceBridgeWeb()),
});

export * from './definitions';
export { GeofenceBridge };
