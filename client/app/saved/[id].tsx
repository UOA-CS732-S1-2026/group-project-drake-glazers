import { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { FeedCard } from '@/components/feed-card';
import { SaveToCollectionSheet } from '@/components/save-to-collection-sheet';
import { Text } from '@/components/ui/text';
import { useCollectionMemories, useSavedPairs, useSavedCollections } from '@/hooks/use-saved';
import type { ExploreMemory } from '@/lib/types';

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: memories = [], isLoading, isError, refetch } = useCollectionMemories(id);
  const { data: savedPairs = [] } = useSavedPairs();
  const { data: collections = [] } = useSavedCollections();

  const [refreshing, setRefreshing] = useState(false);
  const [activeMemory, setActiveMemory] = useState<ExploreMemory | null>(null);

  const collection = collections.find((c) => c.id === id);

  const savedMemoryIds = new Set(savedPairs.map((p) => p.memoryId));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#b71422" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color="#1c1b1b" />
        </TouchableOpacity>
        <Text variant="headline-md" style={styles.title} numberOfLines={1}>
          {collection?.name ?? 'Collection'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: '#fcf9f8' }}
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
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
        {isError && (
          <View style={styles.centeredMsg}>
            <MaterialIcons name="error-outline" size={32} color="#b71422" />
            <Text variant="body-md" style={styles.msgText}>
              Couldn't load memories. Pull to retry.
            </Text>
          </View>
        )}

        {memories.map((m) => (
          <View key={m.id} style={{ marginBottom: 16 }}>
            <FeedCard
              memory={m}
              isSaved={savedMemoryIds.has(m.id)}
              onPress={() => router.push(`/memory/${m.id}/public`)}
              onBookmarkPress={() => setActiveMemory(m)}
            />
          </View>
        ))}

        {!isLoading && !isError && memories.length === 0 && (
          <View style={styles.centeredMsg}>
            <MaterialIcons name="bookmark-border" size={48} color="#e4beba" />
            <Text variant="headline-md" style={styles.emptyTitle}>
              Nothing saved here yet
            </Text>
            <Text variant="body-md" style={styles.msgText}>
              Go to Explore and tap the bookmark icon on any memory.
            </Text>
          </View>
        )}
      </ScrollView>

      <SaveToCollectionSheet
        memory={activeMemory}
        savedPairs={savedPairs}
        onClose={() => setActiveMemory(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fcf9f8',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fcf9f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fcf9f8',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ede8e8',
  },
  backBtn: {
    width: 40,
  },
  title: {
    flex: 1,
    color: '#1c1b1b',
    textAlign: 'center',
  },
  centeredMsg: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#1c1b1b',
    marginTop: 16,
    textAlign: 'center',
  },
  msgText: {
    color: '#5b403e',
    marginTop: 8,
    textAlign: 'center',
  },
});
