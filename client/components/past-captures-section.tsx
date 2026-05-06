import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import { Text } from '@/components/ui/text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useUserMemoriesWithCovers } from '@/hooks/use-user-memories-with-covers';
import { MemoryWithCover } from '@/lib/types';

const GUTTER = 16;
const GAP = 8;

type ViewMode = 'mosaic' | 'grid';

function CaptureCard({
  memory,
  width,
  height,
}: {
  memory: MemoryWithCover;
  width: number;
  height: number;
}) {
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
    </Pressable>
  );
}

type Props = { userId: string };

export function PastCapturesSection({ userId }: Props) {
  const { width } = useWindowDimensions();
  const { data: memories = [] } = useUserMemoriesWithCovers(userId);
  const [viewMode, setViewMode] = useState<ViewMode>('mosaic');

  const shuffled = useMemo(() => {
    const copy = [...memories];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    return copy;
  }, [userId, memories.length]);

  if (memories.length === 0) return null;

  const contentWidth = width - GUTTER * 2;
  const halfWidth = (contentWidth - GAP) / 2;
  const fullHeight = Math.round(contentWidth * 0.55);
  const halfHeight = Math.round(halfWidth * 0.95);
  const gridHeight = Math.round(halfWidth * 1.1);

  function cardDims(index: number): { w: number; h: number } {
    if (viewMode === 'grid') return { w: halfWidth, h: gridHeight };
    return index % 3 === 0 ? { w: contentWidth, h: fullHeight } : { w: halfWidth, h: halfHeight };
  }

  return (
    <View className="mt-lg mb-xl">
      <View className="flex-row justify-between items-center mx-gutter mb-sm">
        <Text variant="headline-md">Past Captures</Text>
        <View style={{ flexDirection: 'row', gap: GAP }}>
          <Pressable onPress={() => setViewMode('mosaic')}>
            <IconSymbol
              name="square.grid.2x2.fill"
              size={22}
              color={viewMode === 'mosaic' ? '#b71422' : '#8f6f6d'}
            />
          </Pressable>
          <Pressable onPress={() => setViewMode('grid')}>
            <IconSymbol
              name="rectangle.grid.1x2.fill"
              size={22}
              color={viewMode === 'grid' ? '#b71422' : '#8f6f6d'}
            />
          </Pressable>
        </View>
      </View>

      <View style={{ marginHorizontal: GUTTER, flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
        {shuffled.map((memory, index) => {
          const { w, h } = cardDims(index);
          return <CaptureCard key={memory.id} memory={memory} width={w} height={h} />;
        })}
      </View>
    </View>
  );
}
