import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useAuth } from '@clerk/clerk-expo';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect } from 'react';

import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(nav)',
};

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
  );
}
