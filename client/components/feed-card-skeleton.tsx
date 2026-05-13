import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

function Block({ style }: { style?: object }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.block, style, animStyle]} />;
}

export function FeedCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Header: avatar circle + two text lines */}
      <View style={styles.header}>
        <Block style={styles.avatar} />
        <View style={styles.headerText}>
          <Block style={styles.nameLine} />
          <Block style={styles.locationLine} />
        </View>
      </View>

      {/* Image area */}
      <Block style={styles.image} />

      {/* Footer: title + description + bookmark */}
      <View style={styles.footer}>
        <View style={{ flex: 1, gap: 8 }}>
          <Block style={styles.titleLine} />
          <Block style={styles.descLine} />
        </View>
        <Block style={styles.bookmark} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  block: {
    backgroundColor: '#ede8e8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  nameLine: {
    height: 12,
    borderRadius: 4,
    width: '45%',
  },
  locationLine: {
    height: 10,
    borderRadius: 4,
    width: '30%',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  titleLine: {
    height: 14,
    borderRadius: 4,
    width: '70%',
  },
  descLine: {
    height: 12,
    borderRadius: 4,
    width: '90%',
  },
  bookmark: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginTop: 2,
  },
});
