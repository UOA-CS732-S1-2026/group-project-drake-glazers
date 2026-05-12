import { useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CollectionCard } from '@/components/collection-card';
import { CollectionCardSkeleton } from '@/components/collection-card-skeleton';
import { Text } from '@/components/ui/text';
import { useSavedCollections, useCreateCollection } from '@/hooks/use-saved';
import type { SavedCollection } from '@/lib/types';

type ListItem = SavedCollection | { _skeleton: true; id: string };

export default function SavedScreen() {
  const router = useRouter();
  const { data: collections = [], isLoading, isFetching, refetch } = useSavedCollections();

  const listData: ListItem[] =
    isLoading && collections.length === 0
      ? Array.from({ length: 6 }, (_, i) => ({ _skeleton: true as const, id: `sk-${i}` }))
      : collections;
  const createCollection = useCreateCollection();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    try {
      await createCollection.mutateAsync(name);
      setNewName('');
      setShowCreate(false);
    } catch {
      // error surfaced via React Query
    }
  }

  function handleCancel() {
    setNewName('');
    setShowCreate(false);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text variant="headline-lg" style={styles.headerTitle}>
          Saved
        </Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} hitSlop={8} style={styles.addBtn}>
          <MaterialIcons name="add" size={28} color="#1c1b1b" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<View style={{ height: 4 }} />}
        renderItem={({ item }) =>
          '_skeleton' in item ? (
            <CollectionCardSkeleton />
          ) : (
            <CollectionCard
              collection={item}
              onPress={() => router.push(`/saved/${item.id}`)}
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor="#b71422"
            colors={['#b71422']}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <MaterialIcons name="bookmark-border" size={48} color="#e4beba" />
              <Text variant="body-md" style={styles.emptyText}>
                {'Nothing saved yet.\nTap the bookmark icon on any memory to save it.'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Create collection modal */}
      <Modal
        visible={showCreate}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleCancel}>
          <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
            <Text variant="body-lg" style={styles.modalTitle}>
              New collection
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Collection name"
              placeholderTextColor="#c9a9a6"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={handleCancel} style={styles.modalCancelBtn}>
                <Text variant="body-md" style={{ color: '#8c7c7b', fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                style={[
                  styles.modalCreateBtn,
                  !newName.trim() && styles.modalCreateBtnDisabled,
                ]}
                disabled={!newName.trim() || createCollection.isPending}
              >
                <Text variant="body-md" style={{ color: '#fff', fontWeight: '700' }}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fcf9f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    color: '#1c1b1b',
  },
  addBtn: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 32,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyText: {
    color: '#8c7c7b',
    textAlign: 'center',
    lineHeight: 22,
  },
  // ── Create modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    color: '#1c1b1b',
    fontWeight: '700',
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#fcf9f8',
    borderWidth: 1,
    borderColor: '#ede8e8',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: '#1c1b1b',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ede8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCreateBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#b71422',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCreateBtnDisabled: {
    backgroundColor: '#e4beba',
  },
});
