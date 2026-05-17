import type { CapacitorConfig } from '@capacitor/cli';

/**
 * IMPORTANT — IP CONFIGURATION:
 *  - Android Emulator: use 10.0.2.2 (maps to host machine's localhost)
 *  - Real Android Device: change to your computer's LAN IP, e.g. 192.168.1.100
 *    Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find your LAN IP.
 */
const BACKEND_HOST = '10.0.2.2'; // Change to LAN IP for real device

const config: CapacitorConfig = {
  appId: 'com.axiom.javelin',
  appName: 'Axiom Javelin',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true, // Required to reach local HTTP backend
    allowNavigation: [
      '10.0.2.2',
      '10.125.129.121',
      '192.168.1.*',
      '10.*.*.*',
      'localhost',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0A1929',
      showSpinner: true,
      spinnerColor: '#00D4FF',
      androidScaleType: 'CENTER_CROP',
    },
    Keyboard: {
      resize: 'body' as any,
      style: 'dark' as any,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
