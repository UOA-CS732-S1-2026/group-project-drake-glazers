import { View, type ViewProps } from 'react-native';

type Props = ViewProps & {
  elevated?: boolean;
};

export function Card({ elevated = true, className = '', children, ...props }: Props) {
  return (
    <View
      className={`
        bg-surface-container-lowest rounded-xl p-md
        ${elevated ? 'shadow-card' : 'border border-outline-variant'}
        ${className}
      `}
      {...props}
    >
      {children}
    </View>
  );
}
