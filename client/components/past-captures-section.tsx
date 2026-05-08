import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text } from '@/components/ui/text';
import { useUserMemoriesWithCovers } from '@/hooks/use-user-memories-with-covers';
import { MemoryWithCover } from '@/lib/types';

const GUTTER = 16;
const GAP = 8;
const MAX_CARDS = 4;

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

      {memory.relativeArea && (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: 'rgba(0,0,0,0.72)',
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <Text
            style={{ color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.2 }}
            numberOfLines={1}
          >
            {memory.relativeArea}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

type Props = { userId: string };

export function PastCapturesSection({ userId }: Props) {
  const { width } = useWindowDimensions();
  const { data: memories = [] } = useUserMemoriesWithCovers(userId);

  const shuffled = useMemo(() => {
    const copy = memories.filter((m) => m.coverImage !== null);
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    return copy.slice(0, MAX_CARDS);
  }, [userId, memories.length]);

  if (memories.length === 0) return null;

  const contentWidth = width - GUTTER * 2;
  const halfWidth = (contentWidth - GAP) / 2;
  const fullHeight = Math.round(contentWidth * 0.55);
  const halfHeight = Math.round(halfWidth * 0.95);

  const [a, b, c, d] = shuffled;

  return (
    <View className="mt-lg mb-xl">
      <View className="mx-gutter mb-sm">
        <Text variant="headline-md">Past Captures</Text>
      </View>

      <View style={{ marginHorizontal: GUTTER, gap: GAP }}>
        {/* Row 1 — full width */}
        {a && <CaptureCard memory={a} width={contentWidth} height={fullHeight} />}

        {/* Row 2 — two halves side by side */}
        {(b || c) && (
          <View style={{ flexDirection: 'row', gap: GAP }}>
            {b && <CaptureCard memory={b} width={halfWidth} height={halfHeight} />}
            {c && <CaptureCard memory={c} width={halfWidth} height={halfHeight} />}
          </View>
        )}

        {/* Row 3 — full width */}
        {d && <CaptureCard memory={d} width={contentWidth} height={fullHeight} />}
      </View>
    </View>
  );
}
