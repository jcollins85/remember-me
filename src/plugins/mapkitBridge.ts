import { registerPlugin, WebPlugin } from "@capacitor/core";

export interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface SnapshotOptions {
  lat: number;
  lng: number;
  width?: number;
  height?: number;
  spanMeters?: number;
}

export interface MapKitBridgePlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
  ping(): Promise<{ value: string }>;
  searchPlaces(options: { query: string; near?: { lat: number; lng: number } }): Promise<{ results: PlaceResult[] }>;
  getSnapshot(options: SnapshotOptions): Promise<{ imageData: string; address?: string }>;
}

class MapKitBridgeWeb extends WebPlugin implements MapKitBridgePlugin {
  async echo(options: { value: string }) {
    return options;
  }
  async ping() {
    return { value: "pong" };
  }
  async searchPlaces(): Promise<{ results: PlaceResult[] }> {
    console.warn("MapKitBridge search is only available on native platforms.");
    return { results: [] };
  }
  async getSnapshot(): Promise<{ imageData: string; address?: string }> {
    throw this.unimplemented("Map snapshots are only available on device.");
  }
}

export const MapKitBridge = registerPlugin<MapKitBridgePlugin>("MapKitBridge", {
  web: () => Promise.resolve(new MapKitBridgeWeb()),
});
