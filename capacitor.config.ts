export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  server?: {
    url?: string;
    androidScheme?: string;
    cleartext?: boolean;
    allowNavigation?: string[];
  };
  android?: {
    overrideUserAgent?: string;
    allowMixedContent?: boolean;
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
    url: 'https://mmo277.github.io/antibiotic-awareness/',
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      'mmo277.github.io',
      '*.github.io',
      '*.firebaseapp.com',
      '*.google.com',
      '*.googleapis.com',
      '*.gstatic.com',
    ],
  },
  android: {
    overrideUserAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    allowMixedContent: true,
  },
  plugins: {
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
