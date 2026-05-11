import {
  View,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRef, useCallback, useEffect, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text } from '@/components/ui/text';
import {
  useSavedCollections,
  useSaveMemory,
  useUnsaveMemory,
  useCreateCollection,
} from '@/hooks/use-saved';
import type { SavedPair, ExploreMemory } from '@/lib/types';

type Props = {
  memory: ExploreMemory | null;
  savedPairs: SavedPair[];
  onClose: () => void;
};

const SHEET_HEIGHT = 480;

export function SaveToCollectionSheet({ memory, savedPairs, onClose }: Props) {
  const visible = memory !== null;

  const { data: collections = [] } = useSavedCollections();
  const saveMemory = useSaveMemory();
  const unsaveMemory = useUnsaveMemory();
  const createCollection = useCreateCollection();

  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const dragStartY = useRef(0);

  const slideIn = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 28,
      stiffness: 280,
      mass: 1,
    }).start();
  }, [translateY]);

  const slideOut = useCallback(
    (onDone?: () => void) => {
      Animated.spring(translateY, {
        toValue: SHEET_HEIGHT,
        useNativeDriver: true,
        damping: 28,
        stiffness: 280,
        mass: 1,
      }).start(onDone);
    },
    [translateY]
  );

  useEffect(() => {
    if (visible) {
      setShowNewInput(false);
      setNewCollectionName('');
      slideIn();
    } else {
      slideOut();
    }
  }, [visible, slideIn, slideOut]);

  const handleClose = useCallback(() => {
    slideOut(onClose);
  }, [slideOut, onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy }) => dy > 8,
      onPanResponderGrant: () => {
        dragStartY.current = (translateY as unknown as { _value: number })._value ?? 0;
      },
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) translateY.setValue(dragStartY.current + dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (vy > 0.5 || dy > 120) {
          slideOut(onClose);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 28,
            stiffness: 280,
            mass: 1,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  const savedCollectionIds = new Set(
    savedPairs.filter((p) => p.memoryId === memory!.id).map((p) => p.collectionId)
  );

  function handleToggle(collectionId: string) {
    if (!memory) return;
    if (savedCollectionIds.has(collectionId)) {
      unsaveMemory.mutate({ collectionId, memoryId: memory.id });
    } else {
      saveMemory.mutate({ collectionId, memoryId: memory.id });
    }
  }

  async function handleCreateAndSave() {
    const name = newCollectionName.trim();
    if (!name || !memory) return;
    try {
      const newCol = await createCollection.mutateAsync(name);
      saveMemory.mutate({ collectionId: newCol.id, memoryId: memory.id });
      setShowNewInput(false);
      setNewCollectionName('');
    } catch {
      // error surfaced via React Query
    }
  }

  return (
    <View style={[StyleSheet.absoluteFillObject, { pointerEvents: 'box-none' }]}>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text variant="body-lg" style={styles.headerTitle}>
            Save to
          </Text>
          <TouchableOpacity onPress={handleClose} hitSlop={12}>
            <MaterialIcons name="close" size={22} color="#1c1b1b" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* New collection row */}
            {showNewInput ? (
              <View style={styles.newInputRow}>
                <TextInput
                  style={styles.newInput}
                  placeholder="Collection name"
                  placeholderTextColor="#c9a9a6"
                  value={newCollectionName}
                  onChangeText={setNewCollectionName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCreateAndSave}
                />
                <TouchableOpacity
                  onPress={handleCreateAndSave}
                  disabled={!newCollectionName.trim() || createCollection.isPending}
                  style={styles.confirmBtn}
                >
                  <MaterialIcons name="check" size={20} color="#b71422" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowNewInput(false);
                    setNewCollectionName('');
                  }}
                  style={styles.confirmBtn}
                >
                  <MaterialIcons name="close" size={20} color="#8c7c7b" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.newCollectionRow}
                onPress={() => setShowNewInput(true)}
              >
                <View style={styles.newCollectionIcon}>
                  <MaterialIcons name="add" size={22} color="#b71422" />
                </View>
                <Text variant="body-md" style={{ color: '#b71422', fontWeight: '600' }}>
                  New collection
                </Text>
              </TouchableOpacity>
            )}

            {/* Existing collections */}
            {collections.map((col) => {
              const isSaved = savedCollectionIds.has(col.id);
              return (
                <TouchableOpacity
                  key={col.id}
                  style={styles.collectionRow}
                  onPress={() => handleToggle(col.id)}
                  activeOpacity={0.7}
                >
                  {/* Thumbnail strip (up to 3) */}
                  <View style={styles.thumbStrip}>
                    {col.coverImages.length > 0 ? (
                      col.coverImages.slice(0, 3).map((uri, idx) => (
                        <Image key={idx} source={{ uri }} style={styles.thumb} resizeMode="cover" />
                      ))
                    ) : (
                      <View style={[styles.thumb, styles.thumbPlaceholder]}>
                        <MaterialIcons name="photo-library" size={18} color="#c8c3c2" />
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text variant="body-md" style={{ color: '#1c1b1b', fontWeight: '600' }}>
                      {col.name}
                    </Text>
                    <Text variant="body-sm" style={{ color: '#8c7c7b', marginTop: 2 }}>
                      {col.count} {col.count === 1 ? 'memory' : 'memories'}
                    </Text>
                  </View>

                  {/* Checkmark */}
                  {isSaved && (
                    <MaterialIcons name="check-circle" size={22} color="#b71422" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0d9d8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ede8e8',
  },
  headerTitle: {
    color: '#1c1b1b',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 32,
  },
  newCollectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ede8e8',
    gap: 12,
  },
  newCollectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#b71422',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ede8e8',
    gap: 8,
  },
  newInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0d9d8',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#1c1b1b',
    backgroundColor: '#fcf9f8',
  },
  confirmBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ede8e8',
  },
  thumbStrip: {
    flexDirection: 'row',
    gap: 2,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#f5f0ef',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
