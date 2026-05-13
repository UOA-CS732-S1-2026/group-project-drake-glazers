import { View, Pressable, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ProfileHeader } from '@/components/profile-header';
import { FlashbacksSection } from '@/components/flashbacks-section';
import { PastCapturesSection } from '@/components/past-captures-section';
import { Text } from '@/components/ui/text';

export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  if (!id) return null;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar barStyle="dark-content" />
      <View className="flex-row items-center px-margin pt-md pb-sm">
        <Pressable onPress={() => router.back()} className="mr-sm p-xs">
          <MaterialIcons name="arrow-back" size={24} color="#1c1b1b" />
        </Pressable>
        <Text variant="headline-md">Profile</Text>
      </View>
      <ScrollView className="flex-1">
        <ProfileHeader userId={id} />
        <FlashbacksSection userId={id} />
        <PastCapturesSection userId={id} />
      </ScrollView>
    </SafeAreaView>
  );
}
