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

type Filter = { id: string; label: string };

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

const FILTERS: Filter[] = [
  { id: 'all', label: 'All Stories' },
  { id: 'cafes', label: 'Cafes' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'parks', label: 'Parks' },
  { id: 'art', label: 'Art' },
];

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800';
const PLACEHOLDER_GRID = [
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterChips({
  filters,
  active,
  onSelect,
}: {
  filters: Filter[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {filters.map((f) => {
        const isActive = f.id === active;
        return (
          <TouchableOpacity
            key={f.id}
            onPress={() => onSelect(f.id)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text
              variant="label-md"
              style={{ color: isActive ? '#ffffff' : '#5b403e', textTransform: 'uppercase' }}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function FeaturedCard({ memory, onPress }: { memory: ExploreMemory; onPress: () => void }) {
  const imageUri = memory.imageUrl ?? PLACEHOLDER_IMAGE;

  return (
    <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.92}>
      <Image source={{ uri: imageUri }} style={styles.featuredImage} resizeMode="cover" />

      {/* Location chip */}
      {memory.relativeArea && (
        <View style={styles.locationChip}>
          <MaterialIcons name="place" size={12} color="#b71422" />
          <Text variant="label-md" style={{ color: '#b71422', marginLeft: 3 }}>
            {memory.relativeArea}
          </Text>
        </View>
      )}

      {/* Bottom overlay */}
      <View style={styles.featuredOverlay}>
        <Text variant="body-lg" style={styles.featuredQuote} numberOfLines={2}>
          {memory.title}
        </Text>
        {memory.description ? (
          <Text variant="body-sm" style={styles.featuredDesc} numberOfLines={2}>
            {memory.description}
          </Text>
        ) : null}
        <Text variant="body-sm" style={styles.featuredAuthor}>
          Shared by @{memory.author}
        </Text>
      </View>

      {/* Engagement row */}
      <View style={styles.engagementRow}>
        <View style={styles.engagementLeft}>
          <TouchableOpacity style={styles.engagementBtn}>
            <MaterialIcons name="favorite-border" size={20} color="#5b403e" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.engagementBtn}>
            <MaterialIcons name="chat-bubble-outline" size={20} color="#5b403e" />
          </TouchableOpacity>
        </View>
        <View style={styles.engagementLeft}>
          <TouchableOpacity style={styles.engagementBtn}>
            <MaterialIcons name="bookmark-border" size={20} color="#5b403e" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.engagementBtn}>
            <MaterialIcons name="share" size={20} color="#5b403e" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function GridCard({
  memory,
  index,
  onPress,
}: {
  memory: ExploreMemory;
  index: number;
  onPress: () => void;
}) {
  const imageUri = memory.imageUrl ?? PLACEHOLDER_GRID[index % PLACEHOLDER_GRID.length];
  const isVideo = memory.mediaType === 'video';

  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.88}>
      <Image source={{ uri: imageUri }} style={styles.gridImage} resizeMode="cover" />

      {/* Video overlay */}
      {isVideo && (
        <View style={styles.videoPlay}>
          <MaterialIcons name="play-circle-outline" size={28} color="#fff" />
        </View>
      )}

      {/* Label below image */}
      <View style={styles.gridLabel}>
        <Text variant="body-sm" style={{ color: '#1c1b1b' }} numberOfLines={2}>
          {memory.title}
        </Text>
        {memory.relativeArea && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <MaterialIcons name="place" size={11} color="#b71422" />
            <Text variant="label-md" style={{ color: '#b71422', marginLeft: 2 }}>
              {memory.relativeArea}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function StoriesGrid({
  memories,
  onPress,
}: {
  memories: ExploreMemory[];
  onPress: (m: ExploreMemory) => void;
}) {
  const left = memories.filter((_, i) => i % 2 === 0);
  const right = memories.filter((_, i) => i % 2 !== 0);

  return (
    <View style={styles.grid}>
      <View style={styles.gridCol}>
        {left.map((m, i) => (
          <GridCard key={m.id} memory={m} index={i * 2} onPress={() => onPress(m)} />
        ))}
      </View>
      <View style={[styles.gridCol, { marginTop: 24 }]}>
        {right.map((m, i) => (
          <GridCard key={m.id} memory={m} index={i * 2 + 1} onPress={() => onPress(m)} />
        ))}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');
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

  const featured = memories?.[0];
  const gridMemories = memories?.slice(1, 9) ?? [];

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

      {/* Filter chips */}
      <View style={{ marginTop: 16, marginBottom: 16 }}>
        <FilterChips filters={FILTERS} active={activeFilter} onSelect={setActiveFilter} />
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

      {/* Featured story */}
      {featured && (
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <FeaturedCard memory={featured} onPress={() => router.push(`/memory/${featured.id}`)} />
        </View>
      )}

      {/* Stories grid */}
      {gridMemories.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <StoriesGrid memories={gridMemories} onPress={(m) => router.push(`/memory/${m.id}`)} />
        </View>
      )}

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
  // Filter chips
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e4beba',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#b71422',
    borderColor: '#b71422',
  },

  // Featured card
  featuredCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  featuredImage: {
    width: '100%',
    height: 340,
  },
  locationChip: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  featuredQuote: {
    color: '#fff',
    fontWeight: '700',
  },
  featuredDesc: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  featuredAuthor: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },
  engagementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  engagementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  engagementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCol: {
    flex: 1,
    gap: 10,
  },
  gridCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  gridImage: {
    width: '100%',
    height: 150,
  },
  videoPlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -14 }, { translateY: -14 }],
  },
  gridLabel: {
    padding: 10,
  },
});
