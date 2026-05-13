import { useAuth } from '@clerk/expo';
import { Stack } from 'expo-router';

export default function AuthRoutesLayout() {
  const { isLoaded } = useAuth();

  // Wait for Clerk to load to avoid auth flicker on initial render.
  if (!isLoaded) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
