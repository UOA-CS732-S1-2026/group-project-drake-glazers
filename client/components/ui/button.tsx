import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = TouchableOpacityProps & {
  label: string;
  variant?: Variant;
  loading?: boolean;
};

const containerClass: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface-container-lowest border border-outline-variant',
  ghost: 'bg-transparent',
};

const textClass: Record<Variant, string> = {
  primary: 'text-on-primary',
  secondary: 'text-on-surface',
  ghost: 'text-primary',
};

export function Button({ label, variant = 'primary', loading = false, disabled, className = '', ...props }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      className={`
        flex-row items-center justify-center px-lg py-md rounded-full
        ${containerClass[variant]}
        ${disabled || loading ? 'opacity-50' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#b71422'} />
      ) : (
        <Text className={`text-button font-sans-semibold ${textClass[variant]}`}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
