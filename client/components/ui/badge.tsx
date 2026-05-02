import { View, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'tertiary';

type Props = {
  label: string;
  variant?: Variant;
};

const containerClass: Record<Variant, string> = {
  primary: 'bg-primary-fixed',
  secondary: 'bg-secondary-fixed',
  tertiary: 'bg-tertiary-fixed',
};

const textClass: Record<Variant, string> = {
  primary: 'text-on-primary-fixed-variant',
  secondary: 'text-on-secondary-fixed-variant',
  tertiary: 'text-on-tertiary-fixed-variant',
};

export function Badge({ label, variant = 'primary' }: Props) {
  return (
    <View className={`self-start px-sm py-xs rounded-full ${containerClass[variant]}`}>
      <Text className={`text-label-md font-sans-semibold tracking-[0.05em] ${textClass[variant]}`}>
        {label}
      </Text>
    </View>
  );
}
