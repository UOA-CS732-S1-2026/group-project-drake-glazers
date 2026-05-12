import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import MapboxGL from '@rnmapbox/maps';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { useApiClient } from '@/lib/api';
import CustomSplashScreen from '@/components/custom-splash-screen';

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(nav)',
};

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

const queryClient = new QueryClient();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing publishable key. Please add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your environment variables.'
  );
}

function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const api = useApiClient();
  const colorScheme = useColorScheme();
  const [splashDone, setSplashDone] = useState(false);
  const [fontsLoaded] = useFonts({
    PlaywriteNO: require('../assets/fonts/PlaywriteNO-VariableFont_wght.ttf'),
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Hide the native splash as soon as fonts are ready, then let JS splash take over.
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Navigate only after both the splash animation and auth are done.
  useEffect(() => {
    if (!splashDone || !isLoaded) return;
    if (!isSignedIn) router.replace('/(auth)/sign-in');
  }, [splashDone, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;
    api.post('/api/users', { email }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user?.id]);

  // Native splash covers this gap — return null while fonts aren't ready.
  if (!fontsLoaded) return null;

  // Fonts loaded: hand off to the JS splash which plays the animation,
  // waits for auth, then fades out and calls onComplete.
  if (!splashDone) {
    return <CustomSplashScreen isReady={isLoaded} onComplete={() => setSplashDone(true)} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(nav)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="memory/[id]/index" options={{ headerShown: false }} />
        <Stack.Screen name="memory/[id]/public" options={{ headerShown: false }} />
        <Stack.Screen name="friends/[id]" options={{ title: 'Friend' }} />
        <Stack.Screen name="memory/index" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <InitialLayout />
      </ClerkProvider>
    </QueryClientProvider>
  );
}
