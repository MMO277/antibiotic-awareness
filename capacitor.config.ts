export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  server?: {
    url?: string;
    androidScheme?: string;
    cleartext?: boolean;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins?: Record<string, any>;
}

const config: CapacitorConfig = {
  appId: 'com.antibiotic.awareness',
  appName: 'Antibiotic Awareness',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '745598751795-uepp0fmf1qd9p2reip65m95t32svp29t.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_capsule',
      iconColor: '#0B3C5D',
      sound: 'alarm_chime.wav',
    },
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#0B3C5D',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B3C5D',
    },
  },
};

export default config;
