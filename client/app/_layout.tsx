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
import { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { useApiClient } from '@/lib/api';
import CustomSplashScreen from '@/components/custom-splash-screen';
import NotificationBanner from '@/components/notification-banner';

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
  const pushRegisteredRef = useRef(false);
  const [splashDone, setSplashDone] = useState(false);
  const [incomingNotification, setIncomingNotification] = useState<{
    title: string;
    body: string;
    memoryId?: string | null;
  } | null>(null);
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
    if (isSignedIn) {
      router.replace('/(nav)/');
    } else {
      router.replace('/(auth)/sign-in');
    }
  }, [splashDone, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || pushRegisteredRef.current) return;

    registerForPushNotificationsAsync(api)
      .then(() => {
        pushRegisteredRef.current = true;
      })
      .catch((error) => {
        console.error('Failed to register push notifications', error);
      });
  }, [api, isLoaded, isSignedIn]);

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      const memoryId = typeof (data as any)?.memoryId === 'string' ? (data as any).memoryId : null;
      setIncomingNotification({ title: title ?? 'Memoriez', body: body ?? '', memoryId });
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { memoryId?: unknown };
      const memoryId = typeof data?.memoryId === 'string' ? data.memoryId : null;
      if (memoryId) router.push(`/memory/${memoryId}`);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;
    api.post('/api/users', { email }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user?.id]);

  if (!fontsLoaded) return null;

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
        <Stack.Screen name="lists/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="saved/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
      {incomingNotification && (
        <NotificationBanner
          title={incomingNotification.title}
          body={incomingNotification.body}
          memoryId={incomingNotification.memoryId}
          onDismiss={() => setIncomingNotification(null)}
        />
      )}
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
