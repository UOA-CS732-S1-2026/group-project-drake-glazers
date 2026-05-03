import { ActivityIndicator, Image, Linking, ScrollView, View } from 'react-native';
import type { ReactNode } from 'react';
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

const mediaLabel: Record<MediaType, string> = {
  image: 'Photo',
  video: 'Video',
  voice_note: 'Voice memo',
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
      <View className="flex-row items-center justify-between gap-md">
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
        <Badge
          label={visibilityLabel[memory.visibility]}
          variant={visibilityVariant[memory.visibility]}
        />
      </View>

      <Card className="gap-md">
        <View className="gap-xs">
          <Text variant="headline-lg">{memory.title}</Text>
          <Text variant="body-sm" className="text-on-surface-variant">
            {createdDate}
          </Text>
        </View>

        <View className="h-px bg-outline-variant" />

        <View className="gap-sm">
          <InfoRow icon="place" label="Location">
            {memory.latitude.toFixed(5)}, {memory.longitude.toFixed(5)}
          </InfoRow>
          <InfoRow icon="schedule" label="Created">
            {new Date(memory.createdAt).toLocaleString()}
          </InfoRow>
        </View>
      </Card>

      {memory.description ? (
        <Card elevated={false} className="gap-xs">
          <Text variant="label-md" className="text-on-surface-variant">
            Description
          </Text>
          <Text variant="body-md">{memory.description}</Text>
        </Card>
      ) : null}

      <View className="gap-sm">
        <Text variant="headline-md">Media</Text>
        {mediaItems.length > 0 ? (
          mediaItems.map((item) => <MediaItemCard key={item.id} item={item} />)
        ) : (
          <EmptyState label="No media has been attached to this memory." />
        )}
      </View>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  children: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-sm">
      <View className="h-9 w-9 items-center justify-center rounded bg-surface-container-low">
        <MaterialIcons name={icon} size={18} color="#5b403e" />
      </View>
      <View className="flex-1">
        <Text variant="label-md" className="text-on-surface-variant">
          {label}
        </Text>
        <Text variant="body-md">{children}</Text>
      </View>
    </View>
  );
}

function MediaItemCard({ item }: { item: Media }) {
  const hasUrl = typeof item.signedUrl === 'string';

  if (item.mediaType === 'image' && hasUrl) {
    return (
      <Card className="overflow-hidden p-0">
        <Image
          source={{ uri: item.signedUrl ?? undefined }}
          className="h-56 w-full"
          resizeMode="cover"
        />
        <View className="gap-xs p-md">
          <Text variant="body-lg">{mediaLabel[item.mediaType]}</Text>
          <Text variant="body-sm" className="text-on-surface-variant">
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card elevated={false} className="gap-md">
      <View className="flex-row items-center gap-sm">
        <View className="h-12 w-12 items-center justify-center rounded-lg bg-surface-container-low">
          <MaterialIcons name={mediaIcon[item.mediaType]} size={24} color="#5b403e" />
        </View>
        <View className="flex-1">
          <Text variant="body-lg">{mediaLabel[item.mediaType]}</Text>
          <Text variant="body-sm" className="text-on-surface-variant">
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
      {hasUrl ? (
        <Button
          label="Open Media"
          variant="secondary"
          onPress={() => Linking.openURL(item.signedUrl as string)}
        />
      ) : null}
    </Card>
  );
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
