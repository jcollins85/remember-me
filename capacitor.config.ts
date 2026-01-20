import type { CapacitorConfig } from '@capacitor/cli';

type ExtendedCapConfig = CapacitorConfig & {
  ios?: CapacitorConfig['ios'] & {
    swiftPackageManager?: {
      packageClassList: string[];
    };
  };
};

const config: ExtendedCapConfig = {
  appId: 'com.eraone.methere',
  appName: 'MetHere',
  webDir: 'dist',
  ios: {
    scheme: 'MetHere',
    swiftPackageManager: {
      packageClassList: [
        'HapticsPlugin',
        'GeolocationPlugin',
        'LocalNotificationsPlugin',
        'MapKitBridgePlugin',
        'GeofenceBridgePlugin',
      ],
    },
  },
};

export default config;
