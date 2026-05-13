import { View } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useFriends } from '@/hooks/use-friends';
import { useUserMemories } from '@/hooks/use-user-memories';
import { useUserProfile } from '@/hooks/use-user-profile';
import { OnboardingModal } from '@/components/onboarding-modal';
import { LoadableImage as Image } from '@/components/loadable-image';
import { FeedCardSkeleton } from '@/components/feed-card-skeleton';

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// Count distinct locations based on the human-readable relative area label.
function uniquePlacesCount(memories: { relativeArea?: string | null }[]): number {
  const seen = new Set(memories.map((m) => m.relativeArea).filter((r): r is string => !!r));
  return seen.size;
}

function StatItem({ value, label, loading }: { value: number; label: string; loading?: boolean }) {
  return (
    <View className="flex-1 items-center gap-xs">
      {loading ? (
        <FeedCardSkeleton variant="image" style={{ width: 32, height: 22, borderRadius: 4 }} />
      ) : (
        <Text variant="headline-md">{formatCount(value)}</Text>
      )}
      <Text
        variant="label-md"
        className="text-on-surface-variant"
        style={{ fontSize: 10 }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

type Props = {
  userId: string;
};

// Profile header shows avatar, stats, and edit actions for the current user.
export function ProfileHeader({ userId }: Props) {
  const { userId: myId, signOut } = useAuth();
  const router = useRouter();
  const isOwnProfile = userId === myId;
  const [editVisible, setEditVisible] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  const { data: memories = [], isLoading: memoriesLoading } = useUserMemories(userId);
  const { data: friends = [], isLoading: friendsLoading } = useFriends();
  const { data: profile, isLoading: profileLoading } = useUserProfile(
    isOwnProfile ? undefined : userId
  );

  return (
    <>
      <View className="bg-surface-container-lowest mx-gutter mt-md rounded-xl p-md border border-outline-variant">
        {/* Avatar + stats */}
        <View className="flex-row items-center">
          {profileLoading ? (
            <FeedCardSkeleton variant="image" style={{ width: 80, height: 80, borderRadius: 40 }} />
          ) : (
            <Image
              source={
                profile?.avatarUrl
                  ? { uri: profile.avatarUrl }
                  : require('@/assets/images/default-pfp.png')
              }
              style={{ width: 80, height: 80, borderRadius: 40 }}
            />
          )}
          <View className="flex-1 flex-row justify-around ml-md">
            <StatItem value={memories.length} label="MEMORIES" loading={memoriesLoading} />
            <StatItem
              value={uniquePlacesCount(memories)}
              label="PLACES"
              loading={memoriesLoading}
            />
            {isOwnProfile && (
              <StatItem value={friends.length} label="FRIENDS" loading={friendsLoading} />
            )}
          </View>
        </View>

        {/* Name + bio */}
        <View className="mt-md">
          {profileLoading ? (
            <FeedCardSkeleton variant="image" style={{ width: 160, height: 22, borderRadius: 6 }} />
          ) : (
            <Text variant="headline-md">{profile?.displayName ?? 'Name'}</Text>
          )}
          {!profileLoading && profile?.bio ? (
            <Text variant="body-md" className="text-on-surface-variant mt-xs">
              {profile.bio}
            </Text>
          ) : null}
        </View>

        {/* Edit profile + sign out — own profile only */}
        {isOwnProfile && (
          <View className="mt-md flex-row gap-sm">
            <Button label="Edit Profile" variant="primary" onPress={() => setEditVisible(true)} />
            <Button label="Sign Out" variant="secondary" onPress={handleSignOut} />
          </View>
        )}
      </View>

      {isOwnProfile && (
        <OnboardingModal
          visible={editVisible}
          profile={profile ?? null}
          onComplete={() => setEditVisible(false)}
          onClose={() => setEditVisible(false)}
        />
      )}
    </>
  );
}
