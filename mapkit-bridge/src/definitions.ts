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
  searchPlaces(options: {
    query: string;
    near?: { lat: number; lng: number };
  }): Promise<{ results: PlaceResult[] }>;
  getSnapshot(options: SnapshotOptions): Promise<{ imageData: string; address?: string }>;
}
