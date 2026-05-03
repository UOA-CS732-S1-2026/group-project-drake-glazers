import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useMemoryMedia } from '@/hooks/use-memory-media';
import { useMemoryDetails } from '@/hooks/use-memories';
import type { Media, MediaType, Visibility } from '@/lib/types';

const visibilityLabel: Record<Visibility, string> = {
  public: 'Public',
  friends_only: 'Friends',
  private: 'Private',
};

const visibilityVariant: Record<Visibility, 'primary' | 'secondary' | 'tertiary'> = {
  public: 'tertiary',
  friends_only: 'secondary',
  private: 'primary',
};

const mediaIcon: Record<MediaType, keyof typeof MaterialIcons.glyphMap> = {
  image: 'image',
  video: 'videocam',
  voice_note: 'mic',
};

export default function MemoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const memoryId = Array.isArray(id) ? id[0] : id;

  const {
    data: memory,
    isLoading: isMemoryLoading,
    error: memoryError,
  } = useMemoryDetails(memoryId);
  const {
    data: mediaItems = [],
    isLoading: isMediaItemsLoading,
    error: mediaItemsError,
  } = useMemoryMedia(memoryId);

  const loading = isMemoryLoading || isMediaItemsLoading;
  const error = memoryError ?? mediaItemsError;

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

  const createdDate = new Date(memory.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter pt-xl pb-xl gap-md"
    >
      <Button label="Back" variant="ghost" onPress={() => router.back()} className="self-start" />

      <Card className="gap-sm">
        <View className="flex-row items-start justify-between gap-sm">
          <Text variant="headline-lg" className="flex-1">
            {memory.title}
          </Text>
          <Badge
            label={visibilityLabel[memory.visibility]}
            variant={visibilityVariant[memory.visibility]}
          />
        </View>

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
            {createdDate}
          </Text>
        </View>

        {memory.description ? (
          <>
            <View className="h-px bg-outline-variant" />
            <Text variant="body-md">{memory.description}</Text>
          </>
        ) : null}
      </Card>

      {mediaItems.length > 0 ? (
        <View className="gap-sm">
          <Text variant="headline-md">Media</Text>
          <MediaCollage items={mediaItems} />
        </View>
      ) : (
        <EmptyState label="No media has been attached to this memory." />
      )}
    </ScrollView>
  );
}

function MediaCollage({ items }: { items: Media[] }) {
  const images = items.filter((m) => m.mediaType === 'image' && typeof m.signedUrl === 'string');
  const others = items.filter((m) => !(m.mediaType === 'image' && typeof m.signedUrl === 'string'));

  return (
    <View className="gap-sm">
      {images.length > 0 && <ImageGrid images={images} />}
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

  // 4+ images: 2×2 grid, +N overlay on last tile if more exist
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

function EmptyState({ label }: { label: string }) {
  return (
    <View className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-lg">
      <Text variant="body-md" className="text-center text-on-surface-variant">
        {label}
      </Text>
    </View>
  );
}
