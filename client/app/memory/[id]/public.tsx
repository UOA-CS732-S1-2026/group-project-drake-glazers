import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { Video, ResizeMode, VideoFullscreenUpdate } from 'expo-av';
import { useVideoThumbnail } from '@/hooks/use-video-thumbnail';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useMemoryMedia } from '@/hooks/use-memory-media';
import { useMemoryDetails } from '@/hooks/use-memories';
import type { Media, MediaType } from '@/lib/types';

const mediaIcon: Record<MediaType, keyof typeof MaterialIcons.glyphMap> = {
  image: 'image',
  video: 'videocam',
  voice_note: 'mic',
};

export default function PublicMemoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const memoryId = Array.isArray(id) ? id[0] : id;

  const {
    data: memory,
    isLoading: isMemoryLoading,
    error: memoryError,
  } = useMemoryDetails(memoryId);
  const {
    data: mediaItems = [],
    isLoading: isMediaLoading,
    error: mediaError,
  } = useMemoryMedia(memoryId);

  const loading = isMemoryLoading || isMediaLoading;
  const error = memoryError ?? mediaError;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !memory) {
    return (
      <View className="flex-1 bg-background px-gutter py-xl">
        <Button label="Back" variant="ghost" onPress={() => router.back()} className="self-start" />
        <Card className="mt-xl gap-sm">
          <Text variant="headline-md">Memory unavailable</Text>
          <Text variant="body-md" className="text-on-surface-variant">
            {error instanceof Error ? error.message : 'This memory could not be loaded.'}
          </Text>
        </Card>
      </View>
    );
  }

  const displayDate = new Date(memory.memoryDate ?? memory.createdAt).toLocaleDateString(
    undefined,
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }}
      contentContainerClassName="px-gutter gap-md"
    >
      {/* Back button only — no edit/delete */}
      <View className="flex-row items-center justify-between">
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </View>

      {/* Memory info card */}
      <Card className="gap-sm">
        <Text variant="headline-lg">{memory.title}</Text>

        <View className="flex-row items-center justify-between gap-sm">
          {memory.relativeArea ? (
            <View className="flex-row items-center gap-xs flex-1">
              <MaterialIcons name="place" size={13} color="#9c7873" />
              <Text
                variant="body-sm"
                className="text-on-surface-variant flex-shrink"
                numberOfLines={1}
              >
                {memory.relativeArea}
              </Text>
            </View>
          ) : (
            <View className="flex-1" />
          )}
          <Text variant="body-sm" className="text-on-surface-variant">
            {displayDate}
          </Text>
        </View>

        {memory.description ? (
          <>
            <View className="h-px bg-outline-variant" />
            <Text variant="body-md">{memory.description}</Text>
          </>
        ) : null}
      </Card>

      {/* Media */}
      {mediaItems.length > 0 && (
        <View className="gap-sm">
          <Text variant="headline-md">Media</Text>
          <MediaCollage items={mediaItems} />
        </View>
      )}
    </ScrollView>
  );
}

// ─── Media helpers (same as index.tsx) ───────────────────────────────────────

function MediaCollage({ items }: { items: Media[] }) {
  const images = items.filter((m) => m.mediaType === 'image' && typeof m.signedUrl === 'string');
  const videos = items.filter((m) => m.mediaType === 'video' && typeof m.signedUrl === 'string');
  const others = items.filter(
    (m) =>
      !(m.mediaType === 'image' && typeof m.signedUrl === 'string') &&
      !(m.mediaType === 'video' && typeof m.signedUrl === 'string')
  );

  return (
    <View className="gap-sm">
      {images.length > 0 && <ImageGrid images={images} />}
      {videos.map((video) => (
        <EmbeddedVideoPlayer key={video.id} item={video} />
      ))}
      {others.length > 0 && (
        <View className="flex-row flex-wrap gap-sm">
          {others.map((item) => (
            <MediaIconTile key={item.id} item={item} />
          ))}
        </View>
      )}
    </View>
  );
}

function EmbeddedVideoPlayer({ item }: { item: Media }) {
  const videoRef = useRef<Video>(null);
  const [active, setActive] = useState(false);
  const thumbnail = useVideoThumbnail(item.signedUrl);

  const handleReadyForDisplay = useCallback(async () => {
    try {
      await videoRef.current?.presentFullscreenPlayer();
      await videoRef.current?.playAsync();
    } catch {
      // fullscreen unavailable — play inline instead
      try {
        await videoRef.current?.playAsync();
      } catch {
        setActive(false);
      }
    }
  }, []);

  const handleFullscreenUpdate = useCallback(
    ({ fullscreenUpdate }: { fullscreenUpdate: number }) => {
      if (fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_DISMISS) {
        setActive(false);
      }
    },
    []
  );

  if (!active) {
    return (
      <TouchableOpacity
        style={[grid.clip, videoStyles.poster]}
        onPress={() => setActive(true)}
        activeOpacity={0.8}
      >
        {thumbnail && (
          <Image source={{ uri: thumbnail }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        )}
        <View style={videoStyles.playOverlay}>
          <MaterialIcons name="play-circle-filled" size={56} color="rgba(255,255,255,0.9)" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[grid.clip, { backgroundColor: '#000' }]}>
      <Video
        ref={videoRef}
        source={{ uri: item.signedUrl! }}
        style={{ width: '100%', aspectRatio: 16 / 9 }}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        isLooping={false}
        onReadyForDisplay={handleReadyForDisplay}
        onFullscreenUpdate={handleFullscreenUpdate}
      />
    </View>
  );
}

const videoStyles = StyleSheet.create({
  poster: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function ImageGrid({ images }: { images: Media[] }) {
  const count = images.length;

  if (count === 1) {
    return (
      <View style={grid.clip}>
        <Image
          source={{ uri: images[0].signedUrl ?? undefined }}
          style={{ width: '100%', aspectRatio: 2 }}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (count === 2) {
    return (
      <View style={[grid.clip, grid.row]}>
        {images.map((img) => (
          <Image
            key={img.id}
            source={{ uri: img.signedUrl ?? undefined }}
            style={{ flex: 1, aspectRatio: 4 / 3 }}
            resizeMode="cover"
          />
        ))}
      </View>
    );
  }

  if (count === 3) {
    return (
      <View style={[grid.clip, grid.col]}>
        <Image
          source={{ uri: images[0].signedUrl ?? undefined }}
          style={{ width: '100%', aspectRatio: 2 }}
          resizeMode="cover"
        />
        <View style={grid.row}>
          {images.slice(1).map((img) => (
            <Image
              key={img.id}
              source={{ uri: img.signedUrl ?? undefined }}
              style={{ flex: 1, aspectRatio: 4 / 3 }}
              resizeMode="cover"
            />
          ))}
        </View>
      </View>
    );
  }

  const shown = images.slice(0, 4);
  const overflow = count - 4;
  const rows = [shown.slice(0, 2), shown.slice(2, 4)];

  return (
    <View style={[grid.clip, grid.col]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={grid.row}>
          {row.map((img, colIndex) => {
            const showOverlay = overflow > 0 && rowIndex === 1 && colIndex === row.length - 1;
            return (
              <View key={img.id} style={{ flex: 1, aspectRatio: 4 / 3, overflow: 'hidden' }}>
                <Image
                  source={{ uri: img.signedUrl ?? undefined }}
                  style={{ flex: 1 }}
                  resizeMode="cover"
                />
                {showOverlay && (
                  <View style={[StyleSheet.absoluteFill, grid.overlay]}>
                    <Text variant="headline-md" className="text-white">
                      +{overflow}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const GAP = 2;

const grid = StyleSheet.create({
  clip: { borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: GAP },
  col: { gap: GAP },
  overlay: { backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
});

function MediaIconTile({ item }: { item: Media }) {
  const icon = mediaIcon[item.mediaType];
  const tile = (
    <View className="h-14 w-14 items-center justify-center rounded-lg bg-surface-container-low">
      <MaterialIcons name={icon} size={24} color="#5b403e" />
    </View>
  );
  if (item.signedUrl) {
    return (
      <TouchableOpacity onPress={() => Linking.openURL(item.signedUrl as string)}>
        {tile}
      </TouchableOpacity>
    );
  }
  return tile;
}
