import { Tabs } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/components/ui/text';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { name: 'index', label: 'Home', icon: 'house.fill' as const },
  { name: 'friends', label: 'Friends', icon: 'person.2.fill' as const },
  { name: 'explore', label: 'Explore', icon: 'magnifyingglass' as const },
  { name: 'lists', label: 'Lists', icon: 'list.bullet' as const },
  { name: 'profile', label: 'Profile', icon: 'person.crop.circle.fill' as const },
] as const;

// Token hex values — kept here only because IconSymbol requires a string `color`
// prop. Everything else uses className / design tokens.
const TOKEN = {
  primary: '#b71422', // matches `primary` token
  onSurfaceVariant: '#8c7c7b', // matches `on-surface-variant` token
} as const;

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    // bg-background (#fcf9f8) | border-outline-variant for the top divider
    <View
      className="flex-row bg-background border-t border-outline-variant"
      style={{ paddingBottom: insets.bottom || 12, paddingTop: 8, paddingHorizontal: 8 }}
    >
      {state.routes.map((route: any, index: number) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={tab.label}
            onPress={onPress}
            activeOpacity={0.7}
            className="flex-1 items-center gap-xs"
          >
            {/* Active pill uses primary-fixed — the soft red tint from the design system */}
            <View
              className={`items-center justify-center px-lg py-xs rounded-full ${
                isFocused ? 'bg-primary-fixed' : 'bg-transparent'
              }`}
            >
              <IconSymbol
                name={tab.icon}
                size={22}
                color={isFocused ? TOKEN.primary : TOKEN.onSurfaceVariant}
              />
            </View>

            <Text
              variant="label-md"
              className={isFocused ? 'text-primary' : 'text-on-surface-variant'}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
