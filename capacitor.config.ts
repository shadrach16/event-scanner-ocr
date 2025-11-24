import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.waoapps.photo2calendar',
  appName: 'Photo2Calendar',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  // Add the Android version block to set the SDK versions
  android: {
    // Minimum version required is 34 to satisfy your latest dependencies
    compileSdkVersion: 34, 
    targetSdkVersion: 34
  },
   assets: {
    icon: {
      source: 'app-icon.png' 
    },
    splash: {
      backgroundColor: 'gold', // Example: Dark purple/indigo background
    }
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    }, 
    Filesystem: {
      permissions: ['storage']
    },
      CordovaPurchase: {
      log: 'DEBUG'
      }
  }
};

export default config;

// npx @capacitor/assets generate --iconBackgroundColor '#eeeeee' --iconBackgroundColorDark '#222222' --splashBackgroundColor '#eeeeee' --splashBackgroundColorDark '#111111'