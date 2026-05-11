import { useState, useCallback } from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text } from '@/components/ui/text';
import { FeedCard } from '@/components/feed-card';
import { SaveToCollectionSheet } from '@/components/save-to-collection-sheet';
import { useApiClient } from '@/lib/api';
import { useSavedPairs } from '@/hooks/use-saved';
import { useRouter } from 'expo-router';
import type { ExploreMemory } from '@/lib/types';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const api = useApiClient();

  const [refreshing, setRefreshing] = useState(false);
  const [activeMemory, setActiveMemory] = useState<ExploreMemory | null>(null);

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

  const { data: savedPairs = [] } = useSavedPairs();

  const savedMemoryIds = new Set(savedPairs.map((p) => p.memoryId));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const feedMemories = memories ?? [];

  return (
    <View style={{ flex: 1 }}>
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
            <FeedCard
              memory={m}
              isSaved={savedMemoryIds.has(m.id)}
              onPress={() => router.push(`/memory/${m.id}/public`)}
              onBookmarkPress={() => setActiveMemory(m)}
            />
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

      <SaveToCollectionSheet
        memory={activeMemory}
        savedPairs={savedPairs}
        onClose={() => setActiveMemory(null)}
      />
    </View>
  );
}
