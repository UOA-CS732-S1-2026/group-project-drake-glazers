import { useState } from 'react';
import { View, TextInput, Text, type TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className = '', onFocus, onBlur, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-xs">
      {!!label && (
        <Text className="text-label-md font-sans-semibold text-on-surface-variant tracking-[0.05em]">
          {label}
        </Text>
      )}
      <TextInput
        className={`
          bg-surface-container-low rounded-lg px-md py-md
          text-body-md font-sans text-on-surface
          ${focused ? 'border-2 border-primary' : 'border border-transparent'}
          ${error ? 'border-2 border-error' : ''}
          ${className}
        `}
        placeholderTextColor="#8f6f6d"
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {!!error && <Text className="text-body-sm font-sans text-error">{error}</Text>}
    </View>
  );
}
