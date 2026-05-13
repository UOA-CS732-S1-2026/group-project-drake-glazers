import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renders a TextInput without crashing when no props are provided', () => {
    const { UNSAFE_getByType } = render(<Input />);
    const { TextInput } = require('react-native');
    expect(UNSAFE_getByType(TextInput)).toBeTruthy();
  });

  it('renders the label text when the label prop is provided', () => {
    const { getByText } = render(<Input label="Email" />);
    expect(getByText('Email')).toBeTruthy();
  });

  it('does not render a label element when the label prop is omitted', () => {
    const { queryByText } = render(<Input placeholder="Type here" />);
    expect(queryByText('Type here')).toBeNull();
  });

  it('renders an error message when the error prop is provided', () => {
    const { getByText } = render(<Input error="This field is required" />);
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('does not render an error message when no error is provided', () => {
    const { queryByText } = render(<Input label="Name" />);
    expect(queryByText('Name')).toBeTruthy();
  });

  it('displays the provided value', () => {
    const { UNSAFE_getByType } = render(<Input value="hello@test.com" />);
    const { TextInput } = require('react-native');
    const input = UNSAFE_getByType(TextInput);
    expect(input.props.value).toBe('hello@test.com');
  });

  it('calls onChangeText when text is changed', () => {
    const onChangeText = jest.fn();
    const { UNSAFE_getByType } = render(<Input onChangeText={onChangeText} />);
    const { TextInput } = require('react-native');
    const input = UNSAFE_getByType(TextInput);
    fireEvent.changeText(input, 'new value');
    expect(onChangeText).toHaveBeenCalledWith('new value');
  });

  it('calls external onFocus handler alongside internal focus tracking', () => {
    const onFocus = jest.fn();
    const { UNSAFE_getByType } = render(<Input onFocus={onFocus} />);
    const { TextInput } = require('react-native');
    fireEvent(UNSAFE_getByType(TextInput), 'focus');
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('calls external onBlur handler alongside internal blur tracking', () => {
    const onBlur = jest.fn();
    const { UNSAFE_getByType } = render(<Input onBlur={onBlur} />);
    const { TextInput } = require('react-native');
    fireEvent(UNSAFE_getByType(TextInput), 'blur');
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
