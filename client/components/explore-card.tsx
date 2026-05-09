import { TouchableOpacity, View, Image } from 'react-native';
import { Text } from '@/components/ui/text';

type Props = {
  title: string;
  imageUri: string;
  subtitle?: string;
  onPress?: () => void;
};

export function ExploreCard({ title, imageUri, subtitle, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="w-44 bg-surface-container-lowest rounded-lg overflow-hidden shadow-card"
    >
      <Image source={{ uri: imageUri }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
      <View className="px-sm pt-sm pb-md gap-xs">
        <Text variant="body-md" className="text-on-surface font-sans-semibold" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body-sm" className="text-on-surface-variant" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
