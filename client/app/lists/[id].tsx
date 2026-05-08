import { useState } from 'react';
import { View, Image, FlatList, Pressable, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ListItem } from '@/lib/types';
import {
  useList,
  useListItems,
  useUpdateList,
  useDeleteList,
  useCreateListItem,
  useUpdateListItem,
  useDeleteListItem,
} from '@/hooks/use-lists';
import { ListFormSheet } from '@/components/lists/list-form-sheet';
import { ListItemFormSheet } from '@/components/lists/list-item-form-sheet';
import { DeleteConfirmModal } from '@/components/lists/delete-confirm-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';


export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: list, isLoading: listLoading } = useList(id);
  const { data: items = [], isLoading: itemsLoading } = useListItems(id);
  const updateList = useUpdateList(id);
  const deleteList = useDeleteList();
  const createItem = useCreateListItem(id);
  const updateItem = useUpdateListItem(id);
  const deleteItem = useDeleteListItem(id);

  const [editListVisible, setEditListVisible] = useState(false);
  const [deleteListVisible, setDeleteListVisible] = useState(false);
  const [addItemVisible, setAddItemVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  function handleDeleteList() {
    deleteList.mutate(id, {
      onSuccess: () => {
        setDeleteListVisible(false);
        router.back();
      },
    });
  }

  function handleDeleteItem() {
    if (!deletingItemId) return;
    deleteItem.mutate(deletingItemId, {
      onSuccess: () => setDeletingItemId(null),
    });
  }

  if (listLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#b71422" />
      </SafeAreaView>
    );
  }

  if (!list) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text variant="body-md" className="text-on-surface-variant">List not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center px-margin pt-md pb-sm">
        <Pressable onPress={() => router.back()} className="mr-sm p-xs">
          <MaterialIcons name="arrow-back" size={24} color="#1c1b1b" />
        </Pressable>
        <Text variant="headline-md" className="flex-1" numberOfLines={1}>
          {list.name}
        </Text>
        <Pressable onPress={() => setEditListVisible(true)} className="p-xs">
          <MaterialIcons name="edit" size={20} color="#666" />
        </Pressable>
        <Pressable onPress={() => setDeleteListVisible(true)} className="p-xs ml-xs">
          <MaterialIcons name="delete-outline" size={20} color="#666" />
        </Pressable>
      </View>

      {list.description ? (
        <Text variant="body-sm" className="px-margin pb-sm text-on-surface-variant">
          {list.description}
        </Text>
      ) : null}

      <View className="h-px bg-outline-variant mx-margin mb-xs" />

      {/* Items */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Card elevated={false} className="p-0 overflow-hidden">
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: '100%', height: 200 }}
                resizeMode="cover"
              />
            ) : null}
            <View className="flex-row items-start p-md">
              <View className="flex-1">
                {item.placeName ? (
                  <View className="flex-row items-center mb-xs" style={{ gap: 4 }}>
                    <MaterialIcons name="location-on" size={14} color="#b71422" />
                    <Text variant="label-md" className="text-on-surface-variant flex-1" numberOfLines={1}>
                      {item.placeName}
                    </Text>
                  </View>
                ) : null}
                {item.notes ? (
                  <Text variant="body-sm">{item.notes}</Text>
                ) : null}
              </View>
              <View className="flex-row" style={{ gap: 4, marginLeft: 8 }}>
                <Pressable onPress={() => setEditingItem(item)} className="p-xs">
                  <MaterialIcons name="edit" size={16} color="#888" />
                </Pressable>
                <Pressable onPress={() => setDeletingItemId(item.id)} className="p-xs">
                  <MaterialIcons name="delete-outline" size={16} color="#888" />
                </Pressable>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          !itemsLoading ? (
            <View className="items-center py-12">
              <Text variant="body-md" className="text-on-surface-variant text-center">
                {'No places yet.\nTap Add Place to get started.'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <View style={{ position: 'absolute', bottom: 32, right: 20 }}>
        <Button label="Add Place" onPress={() => setAddItemVisible(true)} />
      </View>

      {/* Modals */}
      <ListFormSheet
        visible={editListVisible}
        onClose={() => setEditListVisible(false)}
        existing={list}
        loading={updateList.isPending}
        onSubmit={(data) => updateList.mutate(data, { onSuccess: () => setEditListVisible(false) })}
      />

      <ListItemFormSheet
        visible={addItemVisible}
        onClose={() => setAddItemVisible(false)}
        loading={createItem.isPending}
        onSubmit={(data) => createItem.mutate(data, { onSuccess: () => setAddItemVisible(false) })}
      />

      <ListItemFormSheet
        visible={!!editingItem}
        onClose={() => setEditingItem(null)}
        mode={editingItem ? { type: 'edit', item: editingItem } : { type: 'create' }}
        loading={updateItem.isPending}
        onSubmit={(data) => {
          if (!editingItem) return;
          updateItem.mutate(
            { itemId: editingItem.id, body: { notes: data.notes } },
            { onSuccess: () => setEditingItem(null) }
          );
        }}
      />

      <DeleteConfirmModal
        visible={deleteListVisible}
        title="Delete List"
        message={`Delete "${list.name}"? This will also remove all places in this list.`}
        onCancel={() => setDeleteListVisible(false)}
        onConfirm={handleDeleteList}
        loading={deleteList.isPending}
      />

      <DeleteConfirmModal
        visible={!!deletingItemId}
        title="Remove Place"
        message="Remove this place from the list?"
        onCancel={() => setDeletingItemId(null)}
        onConfirm={handleDeleteItem}
        loading={deleteItem.isPending}
      />
    </SafeAreaView>
  );
}
