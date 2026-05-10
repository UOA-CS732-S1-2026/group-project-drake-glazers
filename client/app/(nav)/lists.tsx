import { useState } from 'react';
import type React from 'react';
import { View, Image, FlatList, Pressable, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { List } from '@/lib/types';
import { useLists, useCreateList } from '@/hooks/use-lists';
import { ListFormSheet } from '@/components/lists/list-form-sheet';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';

function CoverGrid({ images }: { images: string[] }) {
  const cells = [0, 1, 2, 3];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', height: 180 }}>
      {cells.map((i) => {
        const url = images[i];
        return (
          <View key={i} style={{ width: '50%', height: 90 }}>
            {url ? (
              <Image
                source={{ uri: url }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-surface-container" />
            )}
          </View>
        );
      })}
    </View>
  );
}

function EmptyCover() {
  return (
    <View className="bg-surface-container items-center justify-center" style={{ height: 180 }}>
      <MaterialIcons name="photo-library" size={36} color="#c8c3c2" />
    </View>
  );
}

function ListCard({ list, onPress }: { list: List; onPress: () => void }) {
  const { coverImages } = list;
  let cover: React.ReactNode;
  if (coverImages.length === 0) {
    cover = <EmptyCover />;
  } else if (coverImages.length >= 4) {
    cover = <CoverGrid images={coverImages} />;
  } else {
    cover = (
      <Image
        source={{ uri: coverImages[0] }}
        style={{ width: '100%', height: 180 }}
        resizeMode="cover"
      />
    );
  }

  return (
    <Pressable onPress={onPress} className="mb-md">
      <Card className="p-0 overflow-hidden">
        {cover}
        <View className="px-md py-sm">
          <Text variant="body-lg" numberOfLines={1}>
            {list.name}
          </Text>
          {list.description ? (
            <Text variant="body-sm" className="text-on-surface-variant" numberOfLines={1}>
              {list.description}
            </Text>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

export default function ListsScreen() {
  const router = useRouter();
  const { data: lists = [], isLoading, refetch } = useLists();
  const createList = useCreateList();
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center justify-between px-margin pt-xl pb-sm">
        <Text variant="headline-lg">My Lists</Text>
        <Pressable
          onPress={() => setSheetVisible(true)}
          className="bg-primary rounded-full w-10 h-10 items-center justify-center"
        >
          <MaterialIcons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <ListCard list={item} onPress={() => router.push(`/lists/${item.id}`)} />
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#b71422" />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-16">
              <Text variant="body-md" className="text-on-surface-variant text-center">
                {'No lists yet.\nTap + to create your first one.'}
              </Text>
            </View>
          ) : null
        }
      />

      <ListFormSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        loading={createList.isPending}
        onSubmit={(data) => createList.mutate(data, { onSuccess: () => setSheetVisible(false) })}
      />
    </SafeAreaView>
  );
}
