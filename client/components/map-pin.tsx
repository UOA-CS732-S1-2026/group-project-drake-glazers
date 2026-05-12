import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import MapboxGL from '@rnmapbox/maps';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const PIN_BADGE_ICONS = {
  heart: 'favorite',
  music: 'music-note',
  home: 'home',
} as const satisfies Record<string, keyof typeof MaterialIcons.glyphMap>;

export type PinBadgeIcon = keyof typeof PIN_BADGE_ICONS;

type MapPinProps = {
  id: string;
  coordinate: [number, number];
  title?: string;
  thumbnailUrl?: string | null;
  thumbnailMediaType?: 'image' | 'video' | null;
  /** Icon shown in the bottom-right badge. Defaults to 'heart'. */
  badgeIcon?: PinBadgeIcon;
  onPress?: (id: string, coordinate: [number, number]) => void;
};

const PIN_SIZE = 72;
const BORDER = 5;
const RADIUS = 20;
const INNER_RADIUS = RADIUS - BORDER;
const BADGE_SIZE = 40;
const BADGE_OVERHANG = 13;
const BADGE_BORDER = 5;
const TAIL_HEIGHT = 13;
const TAIL_WIDTH = 30;

// Wrapper must have explicit fixed dimensions so Mapbox can size the marker.
// Extra width on the right accommodates the badge overflowing the bubble corner.
const WRAPPER_WIDTH = PIN_SIZE + BADGE_OVERHANG * 2;
const WRAPPER_HEIGHT = PIN_SIZE + TAIL_HEIGHT;

export function MapPin({
  id,
  coordinate,
  title,
  thumbnailUrl,
  thumbnailMediaType,
  badgeIcon = 'heart',
  onPress,
}: MapPinProps) {
  const initial = title?.trim()[0]?.toUpperCase() ?? '?';

  return (
    // MarkerView (v10) renders children as a React Native overlay. PointAnnotation
    // has a known bug where custom children silently fail to render (shows red dot).
    <MapboxGL.MarkerView id={id} coordinate={coordinate} anchor={{ x: 0.5, y: 1 }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress?.(id, coordinate)}
        style={styles.wrapper}
      >
        {/* Bubble: no overflow:hidden so the badge can protrude the corner */}
        <View style={styles.bubble}>
          {/* Separate inner clip so the image/initial is rounded without clipping the badge */}
          <View style={styles.imageClip}>
            {thumbnailUrl && thumbnailMediaType !== 'video' ? (
              <Image
                source={{ uri: thumbnailUrl }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : thumbnailMediaType === 'video' ? (
              <View style={[StyleSheet.absoluteFillObject, styles.videoPlaceholder]}>
                <MaterialIcons name="play-circle-filled" size={30} color="#ffffff" />
              </View>
            ) : (
              <Text style={styles.initial}>{initial}</Text>
            )}
          </View>

          {/* Badge positioned at bottom-right, overlapping the bubble corner */}
          <View style={styles.badge}>
            <MaterialIcons name={PIN_BADGE_ICONS[badgeIcon]} size={22} color="#ffffff" />
          </View>
        </View>

        {/* Speech-bubble tail; the tip aligns with wrapper bottom-center (the anchor). */}
        <View style={styles.tail} />
      </TouchableOpacity>
    </MapboxGL.MarkerView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: WRAPPER_WIDTH,
    height: WRAPPER_HEIGHT,
    alignItems: 'center',
  },
  bubble: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: RADIUS,
    backgroundColor: '#ffffff',
    borderWidth: BORDER,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 6,
  },
  imageClip: {
    flex: 1,
    borderRadius: INNER_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1b1b',
  },
  videoPlaceholder: {
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: -BADGE_OVERHANG,
    right: -BADGE_OVERHANG,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: '#b71422',
    borderWidth: BADGE_BORDER,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: TAIL_WIDTH / 2,
    borderRightWidth: TAIL_WIDTH / 2,
    borderTopWidth: TAIL_HEIGHT,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ffffff',
    marginTop: -1,
  },
});
