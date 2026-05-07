import { useRef, useEffect, useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { ExploreCard } from '@/components/explore-card';

const ITEM_WIDTH = 176; // w-44
const GAP = 12;
const ITEM_STRIDE = ITEM_WIDTH + GAP;

export type CarouselItem = {
  id: string;
  title: string;
  imageUri: string;
  subtitle?: string;
};

type Props = {
  items: CarouselItem[];
  onPress?: (item: CarouselItem) => void;
  autoScrollInterval?: number;
};

export function InfiniteCarousel({ items, onPress, autoScrollInterval = 3000 }: Props) {
  const listRef = useRef<FlatList>(null);
  const scrollXRef = useRef(0);
  const isResetting = useRef(false);

  // Triple the data so we can scroll in either direction without hitting an end
  const tripled = [...items, ...items, ...items];
  const singleWidth = items.length * ITEM_STRIDE;

  // Start in the middle copy so both directions have room
  useEffect(() => {
    if (items.length === 0) return;
    listRef.current?.scrollToOffset({ offset: singleWidth, animated: false });
    scrollXRef.current = singleWidth;
  }, [singleWidth, items.length]);

  // Auto-advance one card at a time
  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      const next = scrollXRef.current + ITEM_STRIDE;
      listRef.current?.scrollToOffset({ offset: next, animated: true });
    }, autoScrollInterval);
    return () => clearInterval(timer);
  }, [autoScrollInterval, items.length]);

  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const x = e.nativeEvent.contentOffset.x;
      scrollXRef.current = x;

      // When we drift into the last or first copy, silently jump to the middle copy
      if (!isResetting.current && x >= 2 * singleWidth) {
        isResetting.current = true;
        listRef.current?.scrollToOffset({ offset: x - singleWidth, animated: false });
        scrollXRef.current = x - singleWidth;
        isResetting.current = false;
      } else if (!isResetting.current && x <= 0) {
        isResetting.current = true;
        listRef.current?.scrollToOffset({ offset: x + singleWidth, animated: false });
        scrollXRef.current = x + singleWidth;
        isResetting.current = false;
      }
    },
    [singleWidth]
  );

  if (items.length === 0) return null;

  return (
    <FlatList
      ref={listRef}
      horizontal
      data={tripled}
      keyExtractor={(_, index) => String(index)}
      renderItem={({ item }) => (
        <View style={{ marginRight: GAP }}>
          <ExploreCard
            title={item.title}
            imageUri={item.imageUri}
            subtitle={item.subtitle}
            onPress={() => onPress?.(item)}
          />
        </View>
      )}
      showsHorizontalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      snapToInterval={ITEM_STRIDE}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: 16 }}
      getItemLayout={(_, index) => ({
        length: ITEM_STRIDE,
        offset: ITEM_STRIDE * index,
        index,
      })}
    />
  );
}
