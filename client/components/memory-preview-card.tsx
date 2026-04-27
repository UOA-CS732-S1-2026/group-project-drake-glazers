import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Memory } from '@/lib/api';

type Props = {
  memory: Memory;
  onClose: () => void;
};

export function MemoryPreviewCard({ memory, onClose }: Props) {
  const date = new Date(memory.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {memory.title}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={12}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.meta}>
          <View
            style={[
              styles.badge,
              memory.visibility === 'public' ? styles.badgePublic : styles.badgePrivate,
            ]}
          >
            <Text style={styles.badgeText}>{memory.visibility}</Text>
          </View>
          <Text style={styles.date}>{date}</Text>
        </View>
        <Text style={styles.coords}>
          {memory.latitude.toFixed(4)}°, {memory.longitude.toFixed(4)}°
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: 'rgba(15,15,15,0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    flex: 1,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  closeButton: {
    paddingTop: 2,
  },
  closeText: {
    color: '#888',
    fontSize: 16,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePublic: {
    backgroundColor: 'rgba(0,200,100,0.2)',
  },
  badgePrivate: {
    backgroundColor: 'rgba(200,50,50,0.2)',
  },
  badgeText: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    color: '#666',
    fontSize: 13,
  },
  coords: {
    color: '#555',
    fontSize: 12,
    marginTop: 8,
    fontFamily: 'monospace',
  },
});
