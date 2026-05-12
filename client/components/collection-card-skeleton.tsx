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
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.block, style, animStyle]} />;
}

export function CollectionCardSkeleton() {
  return (
    <View style={styles.card}>
      <Block style={styles.cover} />
      <View style={styles.info}>
        <Block style={styles.nameLine} />
        <Block style={styles.countLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 0,
  },
  info: {
    padding: 10,
    gap: 6,
  },
  nameLine: {
    height: 14,
    borderRadius: 4,
    width: '70%',
  },
  countLine: {
    height: 11,
    borderRadius: 4,
    width: '40%',
  },
  block: {
    backgroundColor: '#ede8e8',
  },
});
