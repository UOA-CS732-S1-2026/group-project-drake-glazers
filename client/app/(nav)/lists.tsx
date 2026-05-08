import { useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { List } from '@/lib/types';
import { useLists, useCreateList } from '@/hooks/use-lists';
import { ListFormSheet } from '@/components/lists/list-form-sheet';

const ACCENT_PALETTE = ['#b71422', '#c0392b', '#922b21', '#e74c3c', '#78281f'];

function cardAccent(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return ACCENT_PALETTE[Math.abs(h) % ACCENT_PALETTE.length];
}

function ListCard({ list, onPress }: { list: List; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <View className="bg-[#1c1c1c] rounded-2xl overflow-hidden">
        <View style={{ height: 3, backgroundColor: cardAccent(list.name) }} />
        <View className="p-md pb-lg">
          <Text className="text-white font-sans-bold text-base mb-xs" numberOfLines={1}>
            {list.name}
          </Text>
          <Text className="text-[#666] font-sans text-xs" numberOfLines={2}>
            {list.description ?? 'No description'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function ListsScreen() {
  const router = useRouter();
  const { data: lists = [], isLoading, refetch } = useLists();
  const createList = useCreateList();
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-[#111111]">
      <StatusBar barStyle="light-content" />

      <View className="flex-row items-center justify-between px-margin pt-md pb-sm">
        <Text className="text-white font-sans-bold" style={{ fontSize: 28 }}>
          My Lists
        </Text>
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
        numColumns={2}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        columnWrapperStyle={{ gap: 10 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <ListCard list={item} onPress={() => router.push(`/lists/${item.id}`)} />
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#b71422" />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-16">
              <Text className="text-[#444] font-sans text-base text-center">
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
        onSubmit={(data) =>
          createList.mutate(data, { onSuccess: () => setSheetVisible(false) })
        }
      />
    </SafeAreaView>
  );
}
