import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { useRef, useCallback } from 'react';
import { router } from 'expo-router';
import { useMemoryMedia } from '@/hooks/use-memory-media';
import { LoadableImage as Image } from '@/components/loadable-image';
import type { Memory } from '@/lib/types';

const PEEK_HEIGHT = 136;

type Props = {
  memory: Memory;
  onClose: () => void;
  /** Pre-fetched image URL (e.g. from the explore feed). Shown when useMemoryMedia returns nothing. */
  imageUrl?: string | null;
  /** Pixels from the bottom of the parent to keep the card above overlaying UI (e.g. tab bar). */
  bottomOffset?: number;
};

export function MemoryPreviewCard({ memory, onClose, imageUrl, bottomOffset = 0 }: Props) {
  const { data: mediaItems = [] } = useMemoryMedia(memory.id);

  const firstImage = mediaItems.find(
    (item) => item.mediaType === 'image' && typeof item.signedUrl === 'string'
  );

  const resolvedImageUrl = firstImage?.signedUrl ?? imageUrl ?? null;

  const date = new Date(memory.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const locationLabel =
    memory.relativeArea ?? `${memory.latitude.toFixed(4)}°, ${memory.longitude.toFixed(4)}°`;
  const initial = memory.title.trim()[0]?.toUpperCase() ?? '?';

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
      isExpandedRef.current = true;
      animateTo(0);
    },
    [animateTo, translateY]
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 8,
      onPanResponderGrant: () => {
        // Animated.Value has no public sync getter; _value seeds drag start.
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
      style={[styles.container, { bottom: bottomOffset, transform: [{ translateY }] }]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <View style={styles.sheetTop}>
        <View style={styles.handle} />
        <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={12}>
          <Text style={styles.closeButtonText}>x</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.peekContent}>
        <View style={styles.peekThumbnail}>
          {firstImage?.signedUrl ? (
            <Image
              source={{ uri: firstImage.signedUrl }}
              style={styles.peekImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.peekInitial}>{initial}</Text>
          )}
        </View>
        <View style={styles.peekText}>
          <Text style={styles.title} numberOfLines={1}>
            {memory.title}
          </Text>
          <Text style={styles.peekLocation} numberOfLines={1}>
            {locationLabel}
          </Text>
          <Text style={styles.peekDate}>{date}</Text>
        </View>
      </View>

      <View style={styles.expandedContent}>
        {firstImage?.signedUrl ? (
          <Image source={{ uri: firstImage.signedUrl }} style={styles.image} resizeMode="cover" />
        ) : null}

        <View style={styles.content}>
          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.iconBox}>
              <View style={styles.iconPin} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowPrimary}>{locationLabel}</Text>
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

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/memory/${memory.id}`)}
          >
            <Text style={styles.actionText}>View Memory</Text>
          </TouchableOpacity>
        </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 18,
  },

  sheetTop: {
    height: 36,
    paddingTop: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    lineHeight: 18,
    color: '#555',
    fontWeight: '700',
  },
  peekContent: {
    minHeight: PEEK_HEIGHT - 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  peekThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peekImage: {
    width: '100%',
    height: '100%',
  },
  peekInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1b1b',
  },
  peekText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  peekLocation: {
    marginTop: 5,
    fontSize: 14,
    color: '#555',
  },
  peekDate: {
    marginTop: 4,
    fontSize: 13,
    color: '#888',
  },
  expandedContent: {
    backgroundColor: '#ffffff',
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
  rowText: {
    flex: 1,
    minWidth: 0,
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
    backgroundColor: '#c0392b',
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
