import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text } from '@/components/ui/text';
import type { ExploreMemory } from '@/lib/types';

type Props = {
  memory: ExploreMemory;
  onPress: () => void;
  isSaved: boolean;
  onBookmarkPress: () => void;
};

export function FeedCard({ memory, onPress, isSaved, onBookmarkPress }: Props) {
  const isVideo = memory.mediaType === 'video';
  const imageUri = !isVideo && memory.imageUrl ? memory.imageUrl : null;

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
        {isVideo ? (
          <View style={styles.videoThumbnail}>
            <MaterialIcons name="play-circle-filled" size={48} color="rgba(255,255,255,0.85)" />
          </View>
        ) : (
          <Image source={{ uri: imageUri ?? undefined }} style={styles.feedImage} resizeMode="cover" />
        )}
      </View>

      <View style={styles.feedFooter}>
        <View style={styles.footerRow}>
          <View style={{ flex: 1 }}>
            <Text
              variant="body-md"
              style={{ color: '#1c1b1b', fontWeight: '600' }}
              numberOfLines={2}
            >
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
  videoThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
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
});
