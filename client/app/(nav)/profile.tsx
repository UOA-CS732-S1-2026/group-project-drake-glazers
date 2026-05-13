import { ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@clerk/expo';
import { ProfileHeader } from '@/components/profile-header';
import { FlashbacksSection } from '@/components/flashbacks-section';
import { PastCapturesSection } from '@/components/past-captures-section';

// Profile screen composes user header + memory sections for the signed-in user.
export default function ProfileScreen() {
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();

  if (!userId) return null;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}>
        <ProfileHeader userId={userId} />
        <FlashbacksSection userId={userId} />
        <PastCapturesSection userId={userId} />
      </ScrollView>
    </SafeAreaView>
  );
}
