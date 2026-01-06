import { WebPlugin } from '@capacitor/core';

import type { MapKitBridgePlugin } from './definitions';

export class MapKitBridgeWeb extends WebPlugin implements MapKitBridgePlugin {
    async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
    }
    async ping(): Promise<{ value: string }> {
      return { value: "pong" };
    }

    async searchPlaces(): Promise<{ results: any[] }> {
      return { results: [] };
    }

    async getSnapshot(): Promise<{ imageData: string; address?: string }> {
      throw this.unimplemented('Map snapshots are only available on native iOS.');
    }
}
