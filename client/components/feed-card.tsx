import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text } from '@/components/ui/text';
import type { ExploreMemory } from '@/lib/types';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400';

type Props = {
  memory: ExploreMemory;
  onPress: () => void;
  isSaved: boolean;
  onBookmarkPress: () => void;
};

export function FeedCard({ memory, onPress, isSaved, onBookmarkPress }: Props) {
  const imageUri = memory.imageUrl ?? PLACEHOLDER_IMAGE;
  const isVideo = memory.mediaType === 'video';

  return (
    <TouchableOpacity style={styles.feedCard} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.feedHeader}>
        <View style={styles.feedAuthorRow}>
          <MaterialIcons name="account-circle" size={32} color="#c9a9a6" />
          <View style={{ marginLeft: 8 }}>
            <Text variant="label-md" style={{ color: '#1c1b1b' }}>
              @{memory.author}
            </Text>
            {memory.relativeArea && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                <MaterialIcons name="place" size={11} color="#b71422" />
                <Text variant="label-md" style={{ color: '#b71422', marginLeft: 2 }}>
                  {memory.relativeArea}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={{ position: 'relative' }}>
        <Image source={{ uri: imageUri }} style={styles.feedImage} resizeMode="cover" />
        {isVideo && (
          <View style={styles.videoPlay}>
            <MaterialIcons name="play-circle-outline" size={36} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.feedFooter}>
        <View style={styles.footerRow}>
          <View style={{ flex: 1 }}>
            <Text variant="body-md" style={{ color: '#1c1b1b', fontWeight: '600' }} numberOfLines={2}>
              {memory.title}
            </Text>
            {memory.description && (
              <Text variant="body-sm" style={{ color: '#5b403e', marginTop: 4 }} numberOfLines={2}>
                {memory.description}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={onBookmarkPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.bookmarkBtn}
          >
            <MaterialIcons
              name={isSaved ? 'bookmark' : 'bookmark-border'}
              size={24}
              color={isSaved ? '#b71422' : '#8c7c7b'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  feedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  feedHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  feedAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedImage: {
    width: '100%',
    aspectRatio: 1,
  },
  feedFooter: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bookmarkBtn: {
    marginTop: 2,
  },
  videoPlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -18 }],
  },
});
