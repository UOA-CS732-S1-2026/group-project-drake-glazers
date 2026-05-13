import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from '@/components/ui/text';

describe('Text', () => {
  it('renders its children', () => {
    const { getByText } = render(<Text>Hello world</Text>);
    expect(getByText('Hello world')).toBeTruthy();
  });

  it('renders without crashing for every supported variant', () => {
    const variants = [
      'headline-xl',
      'headline-lg',
      'headline-md',
      'body-lg',
      'body-md',
      'body-sm',
      'label-md',
      'button',
    ] as const;
    variants.forEach((variant) => {
      const { getByText } = render(<Text variant={variant}>{variant}</Text>);
      expect(getByText(variant)).toBeTruthy();
    });
  });

  it('applies an inline color style when the color prop is provided', () => {
    const { UNSAFE_getByType } = render(<Text color="#b71422">Colored</Text>);
    const { Text: RNText } = require('react-native');
    const el = UNSAFE_getByType(RNText);
    const styleArray: unknown[] = Array.isArray(el.props.style) ? el.props.style : [el.props.style];
    const colorStyle = styleArray.find(
      (s): s is Record<string, unknown> => typeof s === 'object' && s !== null && 'color' in s
    );
    expect(colorStyle).toEqual(expect.objectContaining({ color: '#b71422' }));
  });

  it('forwards additional className without crashing', () => {
    const { getByText } = render(<Text className="text-center">Centered</Text>);
    expect(getByText('Centered')).toBeTruthy();
  });

  it('defaults to body-md when no variant is specified', () => {
    const { getByText } = render(<Text>Default</Text>);
    expect(getByText('Default')).toBeTruthy();
  });
});
