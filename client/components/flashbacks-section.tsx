import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from '@/components/ui/text';
import { useUserMemoriesWithCovers } from '@/hooks/use-user-memories-with-covers';
import { MemoryWithCover } from '@/lib/types';

const GUTTER = 16;
const GAP = 8;

function timeAgoLabel(createdAt: string): string {
  const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  if (days < 7) {
    const d = Math.max(1, Math.round(days));
    return `${d} ${d === 1 ? 'DAY' : 'DAYS'} AGO`;
  }
  if (days < 30) {
    const w = Math.round(days / 7);
    return `${w} ${w === 1 ? 'WEEK' : 'WEEKS'} AGO`;
  }
  if (days < 365) {
    const m = Math.round(days / 30);
    return `${m} ${m === 1 ? 'MONTH' : 'MONTHS'} AGO`;
  }
  const y = Math.round(days / 365);
  return `${y} ${y === 1 ? 'YEAR' : 'YEARS'} AGO`;
}

function MemoryCard({ memory, width }: { memory: MemoryWithCover; width: number }) {
  const height = Math.round(width * 1.3);

  return (
    <Pressable
      onPress={() => router.push(`/memory/${memory.id}` as any)}
      style={{ width, height }}
      className="rounded-xl overflow-hidden"
    >
      {memory.coverImage ? (
        <Image
          source={{ uri: memory.coverImage }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : (
        <View className="absolute inset-0 bg-surface-container-high" />
      )}

      <View className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.28)' }} />

      <View className="absolute bottom-0 left-0 right-0 p-sm">
        <View className="self-start bg-secondary-container rounded px-xs py-xs mb-xs">
          <Text variant="label-md" className="text-on-secondary-container">
            {timeAgoLabel(memory.createdAt)}
          </Text>
        </View>
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
  const { data: memories = [] } = useUserMemoriesWithCovers(userId);
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
