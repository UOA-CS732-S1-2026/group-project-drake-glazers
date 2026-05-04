import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from '@/components/ui/text';
import { useMemoryMedia } from '@/hooks/use-memory-media';
import { useUserMemories } from '@/hooks/use-user-memories';
import { Memory } from '@/lib/types';

const GUTTER = 16;
const GAP = 8;

function MemoryCard({ memory, width }: { memory: Memory; width: number }) {
  const { data: media = [] } = useMemoryMedia(memory.id);
  const firstImage = media.find((m) => m.mediaType === 'image');
  const height = Math.round(width * 1.3);

  return (
    <Pressable
      onPress={() => router.push(`/memory/${memory.id}` as any)}
      style={{ width, height }}
      className="rounded-xl overflow-hidden"
    >
      {firstImage?.signedUrl ? (
        <Image
          source={{ uri: firstImage.signedUrl }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : (
        <View className="absolute inset-0 bg-surface-container-high" />
      )}

      <View className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.28)' }} />

      <View className="absolute bottom-0 left-0 right-0 p-sm">
        <Text variant="body-sm" style={{ color: '#ffffff' }} numberOfLines={2}>
          {memory.title}
        </Text>
      </View>
    </Pressable>
  );
}

type Props = { userId: string };

export function FlashbacksSection({ userId }: Props) {
  const { width } = useWindowDimensions();
  const { data: memories = [] } = useUserMemories(userId);
  const [expanded, setExpanded] = useState(false);

  if (memories.length === 0) return null;

  const sorted = [...memories].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const numColumns = Math.max(2, Math.floor((width - GUTTER * 2 + GAP) / (150 + GAP)));
  const cardWidth = (width - GUTTER * 2 - GAP * (numColumns - 1)) / numColumns;

  const displayed = expanded ? sorted : sorted.slice(0, numColumns);
  const hasMore = sorted.length > numColumns;

  return (
    <View className="mt-lg">
      <View className="flex-row justify-between items-center mx-gutter mb-sm">
        <Text variant="headline-md">Flashbacks</Text>
        {hasMore && (
          <Pressable onPress={() => setExpanded((prev) => !prev)}>
            <Text variant="label-md" className="text-primary">
              {expanded ? 'SHOW LESS' : 'SEE ALL'}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={{ marginHorizontal: GUTTER, flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
        {displayed.map((memory) => (
          <MemoryCard key={memory.id} memory={memory} width={cardWidth} />
        ))}
      </View>
    </View>
  );
}
