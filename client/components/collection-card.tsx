import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text } from '@/components/ui/text';
import type { SavedCollection } from '@/lib/types';

type Props = {
  collection: SavedCollection;
  onPress: () => void;
  onLongPress?: () => void;
};

export function CollectionCard({ collection, onPress, onLongPress }: Props) {
  const cover = collection.coverImages[0];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.88}
    >
      <View style={styles.coverContainer}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <MaterialIcons name="photo-library" size={32} color="#c8c3c2" />
          </View>
        )}
        {collection.isDefault && (
          <View style={styles.defaultBadge}>
            <MaterialIcons name="bookmark" size={12} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text variant="body-md" style={styles.name} numberOfLines={1}>
          {collection.name}
        </Text>
        <Text variant="body-sm" style={styles.count}>
          {collection.count} {collection.count === 1 ? 'memory' : 'memories'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  coverContainer: {
    position: 'relative',
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
  },
  coverPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f0ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#b71422',
    borderRadius: 99,
    padding: 4,
  },
  info: {
    padding: 10,
  },
  name: {
    color: '#1c1b1b',
    fontWeight: '600',
  },
  count: {
    color: '#8c7c7b',
    marginTop: 2,
  },
});
