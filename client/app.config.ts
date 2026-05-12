import type { ExpoConfig, ConfigContext } from 'expo/config';

const mapboxDownloadToken = process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Memoriez',
  slug: 'drake-glazers-client',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'Memoriez',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.drakeglazers.app',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSPhotoLibraryUsageDescription:
        'Memoriez needs access to your photo library to attach photos and videos to memories.',
      NSCameraUsageDescription:
        'Memoriez needs camera access to capture photos and videos for your memories.',
      NSMicrophoneUsageDescription: 'Memoriez needs microphone access to record voice memos.',
    },
  },
  android: {
    package: 'com.drakeglazers.app',
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.RECORD_AUDIO',
    ],
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/Memoriez-Logo.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#FFFFFF',
      },
    ],
    [
      '@rnmapbox/maps',
      {
        RNMapboxMapsDownloadToken: mapboxDownloadToken ?? '',
      },
    ],
    '@react-native-community/datetimepicker',
    '@clerk/expo',
    'expo-secure-store',
    'expo-notifications',
    'expo-font',
    [
      'expo-image-picker',
      {
        photosPermission:
          'Memoriez needs access to your photo library to attach photos and videos to memories.',
        cameraPermission: 'Memoriez needs camera access to take photos for your memories.',
        microphonePermission: 'Memoriez needs microphone access to record voice memos.',
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          packagingOptions: {
            exclude: ['META-INF/versions/9/OSGI-INF/MANIFEST.MF'],
          },
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: '72e669b6-fbe0-4669-8090-3801b4d3d487',
    },
  },
  owner: 'memoriez-trial',
});
