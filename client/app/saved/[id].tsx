import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text } from '@/components/ui/text';
import {
  useCollectionMemories,
  useSavedCollections,
  useDeleteCollection,
  useUnsaveMemory,
} from '@/hooks/use-saved';
import type { ExploreMemory } from '@/lib/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COL_GAP = 4;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - COL_GAP * 2) / 3);

type DropdownPos = { top: number; right: number };

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: memories = [], isLoading, isError, refetch } = useCollectionMemories(id);
  const { data: collections = [] } = useSavedCollections();
  const deleteCollection = useDeleteCollection();
  const unsaveMemory = useUnsaveMemory();

  const [refreshing, setRefreshing] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);

  const menuBtnRef = useRef<View>(null);
  const collection = collections.find((c) => c.id === id);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  function handleMenuBtnPress() {
    menuBtnRef.current?.measure((_fx, _fy, w, h, px, py) => {
      setDropdownPos({ top: py + h + 4, right: SCREEN_WIDTH - px - w });
    });
  }

  function toggleSelect(memoryId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(memoryId)) next.delete(memoryId);
      else next.add(memoryId);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  async function handleRemoveSelected() {
    if (selectedIds.size === 0 || isRemoving) return;
    setIsRemoving(true);
    try {
      for (const memoryId of selectedIds) {
        await unsaveMemory.mutateAsync({ collectionId: id, memoryId });
      }
      setSelectedIds(new Set());
      setSelectMode(false);
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleDeleteCollection() {
    setShowDeleteModal(false);
    try {
      await deleteCollection.mutateAsync(collection!.id);
      router.back();
    } catch {
      Alert.alert('Error', 'Could not delete collection. Please try again.');
    }
  }

  const extraData = useMemo(
    () => ({ selectMode, count: selectedIds.size }),
    [selectMode, selectedIds]
  );

  const renderItem = useCallback(
    ({ item }: { item: ExploreMemory }) => {
      const isSelected = selectedIds.has(item.id);
      return (
        <TouchableOpacity
          style={styles.cell}
          onPress={() =>
            selectMode ? toggleSelect(item.id) : router.push(`/memory/${item.id}/public`)
          }
          activeOpacity={selectMode ? 0.7 : 0.85}
        >
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cellImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cellImage, styles.cellPlaceholder]}>
              <MaterialIcons name="photo" size={28} color="#ccc" />
            </View>
          )}
          {item.mediaType === 'video' && !selectMode && (
            <MaterialIcons
              name="play-circle-outline"
              size={20}
              color="#fff"
              style={styles.videoIcon}
            />
          )}
          {selectMode && (
            <View style={[styles.selectOverlay, isSelected && styles.selectOverlayActive]}>
              <View style={[styles.selectCircle, isSelected && styles.selectCircleActive]}>
                {isSelected && <MaterialIcons name="check" size={13} color="#fff" />}
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectMode, selectedIds, id]
  );

  if (isLoading && memories.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator color="#b71422" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      {!selectMode ? (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.headerSlot}>
            <MaterialIcons name="arrow-back" size={24} color="#1c1b1b" />
          </TouchableOpacity>
          <Text variant="headline-md" style={styles.headerTitle} numberOfLines={1}>
            {collection?.name ?? 'Collection'}
          </Text>
          <View ref={menuBtnRef} style={styles.headerSlot}>
            <TouchableOpacity onPress={handleMenuBtnPress} hitSlop={12}>
              <MaterialIcons name="more-vert" size={24} color="#1c1b1b" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.header}>
          <TouchableOpacity onPress={exitSelectMode} hitSlop={8} style={styles.headerSlot}>
            <Text variant="body-md" style={styles.cancelText}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text variant="headline-md" style={styles.headerTitle}>
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select posts'}
          </Text>
          <View style={styles.headerSlot} />
        </View>
      )}

      {/* ─── Subtitle ──────────────────────────────────────────────────────── */}
      {!selectMode && (
        <Text variant="body-sm" style={styles.countText}>
          {memories.length} {memories.length === 1 ? 'post' : 'posts'} saved
        </Text>
      )}

      {isError && (
        <View style={styles.errorRow}>
          <Text variant="body-sm" style={{ color: '#5b403e' }}>
            Could not load posts. Pull down to retry.
          </Text>
        </View>
      )}

      {/* ─── Grid ──────────────────────────────────────────────────────────── */}
      <FlatList
        data={memories}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={{ gap: COL_GAP }}
        ItemSeparatorComponent={() => <View style={{ height: COL_GAP }} />}
        contentContainerStyle={{ paddingTop: COL_GAP, paddingBottom: 32 }}
        extraData={extraData}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#b71422"
            colors={['#b71422']}
          />
        }
        renderItem={renderItem}
        ListEmptyComponent={
          !isLoading && !isError ? (
            <View style={styles.empty}>
              <MaterialIcons name="bookmark-border" size={48} color="#e4beba" />
              <Text variant="headline-md" style={styles.emptyTitle}>
                Nothing saved here yet
              </Text>
              <Text variant="body-md" style={styles.emptyText}>
                Go to Explore and tap the bookmark icon on any memory.
              </Text>
            </View>
          ) : null
        }
      />

      {/* ─── Select mode bottom bar ─────────────────────────────────────────── */}
      {selectMode && (
        <View style={styles.selectBar}>
          <TouchableOpacity
            style={[styles.removeBtn, selectedIds.size === 0 && styles.removeBtnDisabled]}
            onPress={handleRemoveSelected}
            disabled={selectedIds.size === 0 || isRemoving}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text variant="body-md" style={{ color: '#fff', fontWeight: '700' }}>
                {selectedIds.size === 0
                  ? 'Select posts to remove'
                  : `Remove ${selectedIds.size} ${selectedIds.size === 1 ? 'post' : 'posts'}`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Dropdown menu ──────────────────────────────────────────────────── */}
      {dropdownPos && (
        <Modal transparent animationType="none" visible onRequestClose={() => setDropdownPos(null)}>
          {/* Tap-to-close backdrop */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setDropdownPos(null)}
          />
          {/* Menu card positioned below the ... button */}
          <View style={[styles.dropdown, { top: dropdownPos.top, right: dropdownPos.right }]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setDropdownPos(null);
                setSelectMode(true);
              }}
            >
              <MaterialIcons name="check-box" size={18} color="#1c1b1b" />
              <Text variant="body-md" style={{ color: '#1c1b1b' }}>
                Select posts
              </Text>
            </TouchableOpacity>
            {!collection?.isDefault && (
              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setDropdownPos(null);
                  setShowDeleteModal(true);
                }}
              >
                <MaterialIcons name="delete-outline" size={18} color="#b71422" />
                <Text variant="body-md" style={{ color: '#b71422' }}>
                  Delete collection
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Modal>
      )}

      {/* ─── Delete collection modal ────────────────────────────────────────── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.deleteModal}>
            <View style={styles.deleteModalIcon}>
              <MaterialIcons name="delete-forever" size={32} color="#b71422" />
            </View>
            <Text variant="headline-md" style={styles.deleteModalTitle}>
              Delete &quot;{collection?.name}&quot;?
            </Text>
            <Text variant="body-md" style={styles.deleteModalDesc}>
              This collection will be permanently removed. Are you sure you want to delete it?
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeleteModal(false)}>
                <Text variant="body-md" style={{ color: '#5b403e', fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleDeleteCollection}
                disabled={deleteCollection.isPending}
              >
                {deleteCollection.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text variant="body-md" style={{ color: '#fff', fontWeight: '700' }}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fcf9f8',
  },
  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fcf9f8',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ede8e8',
  },
  headerSlot: {
    width: 80,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#1c1b1b',
    textAlign: 'center',
  },
  cancelText: {
    color: '#b71422',
    fontWeight: '600',
  },
  countText: {
    color: '#8c7c7b',
    textAlign: 'center',
    paddingVertical: 8,
  },
  errorRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  // ── Grid
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: 'relative',
  },
  cellImage: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  cellPlaceholder: {
    backgroundColor: '#f5f0ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIcon: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
  // ── Select overlay
  selectOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: 6,
  },
  selectOverlayActive: {
    backgroundColor: 'rgba(183,20,34,0.15)',
  },
  selectCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCircleActive: {
    backgroundColor: '#b71422',
    borderColor: '#b71422',
  },
  // ── Empty state
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    color: '#1c1b1b',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    color: '#5b403e',
    textAlign: 'center',
  },
  // ── Select bar
  selectBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ede8e8',
    backgroundColor: '#fcf9f8',
  },
  removeBtn: {
    backgroundColor: '#b71422',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  removeBtnDisabled: {
    backgroundColor: '#e4beba',
  },
  // ── Dropdown
  dropdown: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    minWidth: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0ebe8',
  },
  // ── Delete modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  deleteModal: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  deleteModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  deleteModalTitle: {
    color: '#1c1b1b',
    textAlign: 'center',
  },
  deleteModalDesc: {
    color: '#5b403e',
    textAlign: 'center',
    lineHeight: 22,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ede8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#b71422',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
