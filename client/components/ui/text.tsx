import { Text as RNText, type TextProps } from 'react-native';

type Variant =
  | 'headline-xl'
  | 'headline-lg'
  | 'headline-md'
  | 'body-lg'
  | 'body-md'
  | 'body-sm'
  | 'label-md'
  | 'button';

const variantClass: Record<Variant, string> = {
  'headline-xl': 'text-headline-xl font-sans-extrabold tracking-[-0.02em]',
  'headline-lg': 'text-headline-lg font-sans-bold tracking-[-0.01em]',
  'headline-md': 'text-headline-md font-sans-bold',
  'body-lg': 'text-body-lg font-sans-medium',
  'body-md': 'text-body-md font-sans',
  'body-sm': 'text-body-sm font-sans',
  'label-md': 'text-label-md font-sans-semibold tracking-[0.05em]',
  button: 'text-button font-sans-semibold',
};

type Props = TextProps & {
  variant?: Variant;
  color?: string;
};

export function Text({ variant = 'body-md', color, className = '', style, ...props }: Props) {
  return (
    <RNText
      className={`text-on-surface ${variantClass[variant]} ${className}`}
      style={[color ? { color } : null, style]}
      {...props}
    />
  );
}
