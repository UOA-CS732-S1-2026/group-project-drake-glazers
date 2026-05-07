import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { ProfileHeader } from '@/components/profile-header';
import { FlashbacksSection } from '@/components/flashbacks-section';
import { PastCapturesSection } from '@/components/past-captures-section';

export default function ProfileScreen() {
  const { userId } = useAuth();

  if (!userId) return null;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1">
        <ProfileHeader userId={userId} />
        <FlashbacksSection userId={userId} />
        <PastCapturesSection userId={userId} />
      </ScrollView>
    </SafeAreaView>
  );
}
