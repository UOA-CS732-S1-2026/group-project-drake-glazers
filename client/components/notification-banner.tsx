import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title: string;
  body: string;
  memoryId?: string | null;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 4500;

export default function NotificationBanner({ title, body, memoryId, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-140);

  const dismiss = () => {
    translateY.value = withTiming(-140, { duration: 300, easing: Easing.in(Easing.cubic) });
    setTimeout(onDismiss, 310);
  };

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) });
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  const handlePress = () => {
    dismiss();
    if (memoryId) router.push(`/memory/${memoryId}`);
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', left: 12, right: 12, top: insets.top + 10, zIndex: 9999 },
        animStyle,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.92}
        className="flex-row items-center bg-surface-container-lowest rounded-xl px-md py-sm shadow-card border border-outline-variant"
      >
        <Ionicons name="heart-circle" size={38} color="#b71422" className="mr-sm" />
        <View className="flex-1 mx-sm">
          <Text className="font-sans-semibold text-body-sm text-on-surface" numberOfLines={1}>
            {title}
          </Text>
          <Text className="font-sans text-body-sm text-on-surface-variant mt-xs" numberOfLines={2}>
            {body}
          </Text>
        </View>
        <TouchableOpacity onPress={dismiss} hitSlop={12}>
          <Ionicons name="close" size={18} color="#8f6f6d" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}
