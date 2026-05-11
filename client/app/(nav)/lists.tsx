import { Alert, View, FlatList, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CollectionCard } from '@/components/collection-card';
import { Text } from '@/components/ui/text';
import { useSavedCollections, useDeleteCollection } from '@/hooks/use-saved';
import type { SavedCollection } from '@/lib/types';

export default function SavedScreen() {
  const router = useRouter();
  const { data: collections = [], isLoading, refetch } = useSavedCollections();
  const deleteCollection = useDeleteCollection();

  function handleLongPress(collection: SavedCollection) {
    if (collection.isDefault) return;
    Alert.alert(
      'Delete collection',
      `Delete "${collection.name}"? Saved memories won't be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCollection.mutate(collection.id),
        },
      ]
    );
  }

  const renderItem = ({ item, index }: { item: SavedCollection; index: number }) => {
    const isOdd = index % 2 !== 0;
    return (
      <View style={{ flex: 1, marginLeft: isOdd ? 6 : 0, marginRight: isOdd ? 0 : 6 }}>
        <CollectionCard
          collection={item}
          onPress={() => router.push(`/saved/${item.id}`)}
          onLongPress={() => handleLongPress(item)}
        />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center justify-between px-margin pt-xl pb-sm">
        <Text variant="headline-lg">Saved</Text>
      </View>

      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#b71422" />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-16">
              <Text variant="body-md" className="text-on-surface-variant text-center">
                {'Nothing saved yet.\nTap the bookmark on any memory to save it.'}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
