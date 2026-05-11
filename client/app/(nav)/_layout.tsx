import { Tabs, usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/components/ui/text';
import { OnboardingModal } from '@/components/onboarding-modal';
import { useUserProfile } from '@/hooks/use-user-profile';

const TABS = [
  { name: 'index', label: 'Home', icon: 'house.fill' as const },
  { name: 'friends', label: 'Friends', icon: 'person.2.fill' as const },
  { name: 'explore', label: 'Explore', icon: 'magnifyingglass' as const },
  { name: 'lists', label: 'Lists', icon: 'list.bullet' as const },
  { name: 'profile', label: 'Profile', icon: 'person.crop.circle.fill' as const },
] as const;

const TOKEN = {
  primary: '#b71422',
  inactive: 'rgba(255,255,255,0.80)',
} as const;

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  const tabItems = state.routes.map((route: any, index: number) => {
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
        style={styles.tabItem}
      >
        <View style={[styles.iconPill, isFocused && styles.iconPillFocused]}>
          <IconSymbol
            name={tab.icon}
            size={22}
            color={isFocused ? TOKEN.primary : TOKEN.inactive}
          />
        </View>
        <Text variant="label-md" style={{ color: isFocused ? TOKEN.primary : TOKEN.inactive }}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={styles.wrapper}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 70 : 100}
        tint="dark"
        style={[styles.bar, { paddingBottom: insets.bottom || 12 }]}
      >
        <View style={styles.row}>{tabItems}</View>
      </BlurView>
    </View>
  );
}

function CreateMemoryFAB() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  // Web has its own FAB in index.web.tsx
  if (Platform.OS === 'web') return null;
  // Only show on the home/map tab
  if (pathname !== '/') return null;

  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: insets.bottom + 76 }]}
      onPress={() => router.push('/memory')}
      activeOpacity={0.85}
    >
      <MaterialIcons name="add" size={28} color="#ffffff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  iconPillFocused: {
    backgroundColor: 'rgba(183,20,34,0.3)',
    shadowColor: '#b71422',
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#b71422',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#b71422',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});

export default function TabLayout() {
  const { data: profile, isLoading } = useUserProfile();
  const [profileConfirmed, setProfileConfirmed] = useState(false);
  const showOnboarding = !isLoading && profile === null && !profileConfirmed;

  return (
    <>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      >
        {TABS.map((tab) => (
          <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
        ))}
      </Tabs>
      <CreateMemoryFAB />
      <OnboardingModal visible={showOnboarding} onComplete={() => setProfileConfirmed(true)} />
    </>
  );
}
