import { useState, useCallback } from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text } from '@/components/ui/text';
import { useApiClient } from '@/lib/api';
import { useRouter } from 'expo-router';

// ─── Types ────────────────────────────────────────────────────────────────────

type ExploreMemory = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  relativeArea: string | null;
  latitude: number;
  longitude: number;
  visibility: string;
  createdAt: string;
  author: string;
  avatarUrl: string | null;
  imageUrl: string | null;
  mediaType: string | null;
};

// ─── Placeholder data ─────────────────────────────────────────────────────────

const PLACEHOLDER_GRID = [
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeedCard({ memory, onPress }: { memory: ExploreMemory; onPress: () => void }) {
  const imageUri = memory.imageUrl ?? PLACEHOLDER_GRID[0];
  const isVideo = memory.mediaType === 'video';

  return (
    <TouchableOpacity style={styles.feedCard} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.feedHeader}>
        <View style={styles.feedAuthorRow}>
          <MaterialIcons name="account-circle" size={32} color="#c9a9a6" />
          <View style={{ marginLeft: 8 }}>
            <Text variant="label-md" style={{ color: '#1c1b1b' }}>
              @{memory.author}
            </Text>
            {memory.relativeArea && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                <MaterialIcons name="place" size={11} color="#b71422" />
                <Text variant="label-md" style={{ color: '#b71422', marginLeft: 2 }}>
                  {memory.relativeArea}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={{ position: 'relative' }}>
        <Image source={{ uri: imageUri }} style={styles.feedImage} resizeMode="cover" />
        {isVideo && (
          <View style={styles.videoPlay}>
            <MaterialIcons name="play-circle-outline" size={36} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.feedFooter}>
        <Text variant="body-md" style={{ color: '#1c1b1b', fontWeight: '600' }} numberOfLines={2}>
          {memory.title}
        </Text>
        {memory.description && (
          <Text variant="body-sm" style={{ color: '#5b403e', marginTop: 4 }} numberOfLines={2}>
            {memory.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const api = useApiClient();

  const [refreshing, setRefreshing] = useState(false);

  const {
    data: memories,
    isLoading,
    isError,
    refetch,
  } = useQuery<ExploreMemory[]>({
    queryKey: ['explore'],
    queryFn: () => api.get('/api/explore'),
    staleTime: 60_000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const feedMemories = memories ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fcf9f8' }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#b71422"
          colors={['#b71422']}
          progressViewOffset={insets.top - 8}
        />
      }
    >
      {/* Page header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text variant="headline-lg" style={{ color: '#1c1b1b' }}>
            Explore memories
          </Text>
          {isLoading && <ActivityIndicator size="small" color="#b71422" />}
        </View>
        <Text variant="body-md" style={{ color: '#5b403e', marginTop: 2 }}>
          Discover what&apos;s happening around you.
        </Text>
      </View>

      {/* Error state */}
      {isError && (
        <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }}>
          <MaterialIcons name="error-outline" size={32} color="#b71422" />
          <Text variant="body-md" style={{ color: '#5b403e', marginTop: 8, textAlign: 'center' }}>
            Couldn&apos;t load memories. Check your connection and try again.
          </Text>
        </View>
      )}

      {/* Feed */}
      {feedMemories.map((m) => (
        <View key={m.id} style={{ marginBottom: 16 }}>
          <FeedCard memory={m} onPress={() => router.push(`/memory/${m.id}/public`)} />
        </View>
      ))}

      {/* Empty state */}
      {!isLoading && !isError && memories?.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
          <MaterialIcons name="photo-library" size={48} color="#e4beba" />
          <Text
            variant="headline-md"
            style={{ color: '#1c1b1b', marginTop: 16, textAlign: 'center' }}
          >
            No public memories yet
          </Text>
          <Text variant="body-md" style={{ color: '#5b403e', marginTop: 8, textAlign: 'center' }}>
            Be the first to share a memory publicly!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  feedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  feedHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  feedAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedImage: {
    width: '100%',
    aspectRatio: 1,
  },
  feedFooter: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  videoPlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -18 }],
  },
});
