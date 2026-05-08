import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ProfileHeader } from '@/components/profile-header';
import { FlashbacksSection } from '@/components/flashbacks-section';
import { PastCapturesSection } from '@/components/past-captures-section';

export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) return null;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1">
        <ProfileHeader userId={id} />
        <FlashbacksSection userId={id} />
        <PastCapturesSection userId={id} />
      </ScrollView>
    </SafeAreaView>
  );
}
