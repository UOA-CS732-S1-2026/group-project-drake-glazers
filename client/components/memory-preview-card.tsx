import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { useRef, useCallback } from 'react';
import { router } from 'expo-router';
import { useMemoryMedia } from '@/hooks/use-memory-media';
import type { Memory } from '@/lib/types';

const PEEK_HEIGHT = 100;

type Props = {
  memory: Memory;
  onClose: () => void;
};

export function MemoryPreviewCard({ memory, onClose }: Props) {
  const { data: mediaItems = [] } = useMemoryMedia(memory.id);

  const firstImage = mediaItems.find(
    (item) => item.mediaType === 'image' && typeof item.signedUrl === 'string'
  );

  const date = new Date(memory.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const translateY = useRef(new Animated.Value(1000)).current;
  const cardHeightRef = useRef(0);
  const dragStartY = useRef(0);
  const isExpandedRef = useRef(false);

  const animateTo = useCallback(
    (toValue: number, onDone?: () => void) => {
      Animated.spring(translateY, {
        toValue,
        useNativeDriver: true,
        damping: 28,
        stiffness: 280,
        mass: 1,
      }).start(onDone);
    },
    [translateY]
  );

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const h = e.nativeEvent.layout.height;
      if (cardHeightRef.current === h) return;
      cardHeightRef.current = h;
      translateY.setValue(h);
      animateTo(h - PEEK_HEIGHT);
    },
    [animateTo, translateY]
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 8,
      onPanResponderGrant: () => {
        dragStartY.current = (translateY as unknown as { _value: number })._value ?? 0;
      },
      onPanResponderMove: (_, { dy }) => {
        const next = dragStartY.current + dy;
        translateY.setValue(Math.max(0, next));
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        const collapsed = cardHeightRef.current - PEEK_HEIGHT;
        const current = dragStartY.current + dy;

        if (vy < -0.5 || dy < -60) {
          isExpandedRef.current = true;
          animateTo(0);
        } else if (vy > 0.5 || dy > 60) {
          if (isExpandedRef.current) {
            isExpandedRef.current = false;
            animateTo(collapsed);
          } else {
            animateTo(cardHeightRef.current, onClose);
          }
        } else {
          const snapTo = current < collapsed / 2 ? 0 : collapsed;
          isExpandedRef.current = snapTo === 0;
          animateTo(snapTo);
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }] }]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* Drag handle + title */}
      <View style={styles.handleBar}>
        <View style={styles.handle} />
        <TouchableOpacity onPress={onClose} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{memory.title}</Text>
      </View>

      {firstImage?.signedUrl ? (
        <Image source={{ uri: firstImage.signedUrl }} style={styles.image} resizeMode="cover" />
      ) : null}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.iconBox}>
            <View style={styles.iconPin} />
          </View>
          <View>
            <Text style={styles.rowPrimary}>
              {memory.relativeArea ??
                `${memory.latitude.toFixed(4)}°, ${memory.longitude.toFixed(4)}°`}
            </Text>
            <Text style={styles.rowSecondary}>{date}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.iconBox}>
            <View
              style={[
                styles.iconDot,
                memory.visibility === 'public' ? styles.iconDotPublic : styles.iconDotPrivate,
              ]}
            />
          </View>
          <Text style={styles.rowPrimary}>
            {memory.visibility === 'public' ? 'Public memory' : 'Private memory'}
          </Text>
        </View>
      </View>

      {/* Action button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/memory/${memory.id}`)}
        >
          <Text style={styles.actionText}>View Memory</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },

  handleBar: {
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginBottom: 14,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 16,
    padding: 4,
  },
  backButtonText: {
    fontSize: 28,
    lineHeight: 30,
    color: '#555',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  image: {
    height: 220,
    width: '100%',
    backgroundColor: '#f0f0f0',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e8e8e8',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#555',
  },
  iconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  iconDotPublic: {
    backgroundColor: '#2a9d5c',
  },
  iconDotPrivate: {
    backgroundColor: '#c0392b',
  },
  rowPrimary: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
  rowSecondary: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },
  actionButton: {
    backgroundColor: '#1a3c5e',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
