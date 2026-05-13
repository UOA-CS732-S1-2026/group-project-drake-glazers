import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders the label text', () => {
    const { getByText } = render(<Button label="Press me" />);
    expect(getByText('Press me')).toBeTruthy();
  });

  it('renders an ActivityIndicator and hides the label when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(<Button label="Submit" loading />);
    expect(queryByText('Submit')).toBeNull();
    // ActivityIndicator should be present in the tree
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('calls onPress when the button is tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Click me" onPress={onPress} />);
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Disabled" disabled onPress={onPress} />);
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders a secondary variant without crashing', () => {
    const { getByText } = render(<Button label="Secondary" variant="secondary" />);
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('renders a ghost variant without crashing', () => {
    const { getByText } = render(<Button label="Ghost" variant="ghost" />);
    expect(getByText('Ghost')).toBeTruthy();
  });

  it('accepts additional className via the className prop', () => {
    const { getByText } = render(<Button label="Styled" className="mt-4" />);
    expect(getByText('Styled')).toBeTruthy();
  });
});
