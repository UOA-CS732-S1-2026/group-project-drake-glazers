import { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const BG = '#FFFFFF';
const CRIMSON = '#8B1A1A';
const TAGLINE_COLOR = '#777';
const ANIM_DURATION = 1400;

interface Props {
  isReady: boolean;
  onComplete: () => void;
}

export default function CustomSplashScreen({ isReady, onComplete }: Props) {
  const animDoneRef = useRef(false);
  const isReadyRef = useRef(isReady);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.75);
  const textOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  const tryComplete = () => {
    if (animDoneRef.current && isReadyRef.current) {
      screenOpacity.value = withTiming(
        0,
        { duration: 300, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(onComplete)();
        }
      );
    }
  };

  const onAnimationDone = () => {
    animDoneRef.current = true;
    tryComplete();
  };

  useEffect(() => {
    isReadyRef.current = isReady;
    if (isReady) tryComplete();
  }, [isReady]);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);

    logoOpacity.value = withTiming(1, { duration: 600, easing: ease });
    logoScale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.2)) });
    textOpacity.value = withDelay(300, withTiming(1, { duration: 500, easing: ease }));
    taglineOpacity.value = withDelay(
      600,
      withSequence(
        withTiming(1, { duration: 500, easing: ease }),
        withDelay(ANIM_DURATION - 600, withTiming(1, { duration: 1 }))
      )
    );

    const timer = setTimeout(() => {
      runOnJS(onAnimationDone)();
    }, ANIM_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <Image
          source={require('../assets/images/Memoriez-Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.textWrapper, textStyle]}>
        <Text style={styles.appName}>Memoriez</Text>
      </Animated.View>

      <Animated.View style={[styles.taglineWrapper, taglineStyle]}>
        <Text style={styles.tagline}>Capture journeys.</Text>
        <Text style={styles.tagline}>Cherish every memory.</Text>
      </Animated.View>

      {isReady === false && (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="small" color={CRIMSON} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    marginBottom: 8,
  },
  logo: {
    width: 180,
    height: 180,
  },
  textWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  appName: {
    fontFamily: 'PlaywriteNO',
    fontSize: 48,
    fontWeight: '700',
    color: CRIMSON,
    letterSpacing: 1,
  },
  taglineWrapper: {
    alignItems: 'center',
    marginTop: 20,
  },
  tagline: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: TAGLINE_COLOR,
    lineHeight: 26,
  },
  loaderWrapper: {
    position: 'absolute',
    bottom: 80,
  },
});
