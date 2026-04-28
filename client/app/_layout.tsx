import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useAuth, ClerkProvider} from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect } from 'react';

import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(nav)',
};


const queryClient = new QueryClient()

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || ""

if (!publishableKey) {
  throw new Error('Missing publishable key. Please add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your environment variables.');
}

export default function RootLayout() {

  const {isSignedIn, isLoaded} = useAuth();
  
  useEffect(() => {

    if (!isLoaded) return;

    SplashScreen.hideAsync();

    if (!isSignedIn) {
      router.replace('/(auth)/sign-in');
    }
  
  }, [isLoaded, isSignedIn])

  const colorScheme = useColorScheme();

  if (!isLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(nav)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="memory/[id]/index" options={{ title: 'Memory' }} />
            <Stack.Screen name="friend/[id]" options={{ title: 'Friend' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ClerkProvider>
    </QueryClientProvider>
  );
}
