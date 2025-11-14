import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PowmIcon, PowmIconName } from './PowmIcon';
import { PowmText } from './PowmText';
import { Row } from './Row';

/**
 * FootBar Component
 *
 * Bottom navigation bar for Powm app.
 * Shows History, Home, and Profile tabs with active state.
 *
 * @example
 * <FootBar />
 */

interface FootBarTab {
  name: string;
  label: string;
  icon: PowmIconName;
  route: string;
}

const TABS: FootBarTab[] = [
  { name: 'history', label: 'History', icon: 'clock', route: '/history' },
  { name: 'home', label: 'Home', icon: 'home', route: '/' },
  { name: 'profile', label: 'Profile', icon: 'profile', route: '/profile' },
];

// Helper pour connaître l’ordre des pages (History=0, Home=1, Profile=2)
const getIndex = (route: string) => {
  if (route === '/history') return 0;
  if (route === '/') return 1;
  if (route === '/profile') return 2;
  return 1;
};

export const FootBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isActive = (route: string) => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  };

  // iPhone 16 height: 852px, footer: 94px ≈ 11% of screen height
  // Use combination of fixed height + safe area for better consistency
  const footerHeight = 94; // Base height
  const totalHeight = footerHeight + insets.bottom;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Row justify="center" align="center" style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const active = isActive(tab.route);
          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                // Ne re-navigue pas si on est déjà sur l’onglet
                if (pathname === tab.route) {
                  return;
                }
                const currentIndex = getIndex(pathname);
                const targetIndex = getIndex(tab.route);
                let transition: string | undefined;
                if (targetIndex > currentIndex) {
                  // on va vers la droite (ex: Home -> Profile)
                  transition = 'slide_from_right';
                } else if (targetIndex < currentIndex) {
                  // on va vers la gauche (ex: Home -> History)
                  transition = 'slide_from_left';
                }
                router.push({
                  pathname: tab.route as any,
                  params: transition ? { transition } : {},
                } as any);
              }}
              style={styles.tab}
            >
              <View style={styles.tabContent}>
                <PowmIcon
                  name={tab.icon}
                  size={26}
                  color={active ? powmColors.electricMain : powmColors.inactive}
                  active={active}
                />
                <PowmText
                  variant="text"
                  color={active ? powmColors.electricMain : powmColors.inactive}
                  style={styles.tabLabel}
                >
                  {tab.label}
                </PowmText>
              </View>
            </Pressable>
          );
        })}
      </Row>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: powmColors.mainBackground,
    borderTopWidth: 1,
    borderTopColor: powmColors.mainBackgroundAlt,
    minHeight: 94, // Base height without safe area
  },
  tabsContainer: {
    paddingTop: powmSpacing.lg,
    paddingHorizontal: powmSpacing.base,
    paddingBottom: powmSpacing.sm,
    gap: powmSpacing.xxl,
  },
  tab: {
    alignItems: 'center',
    minWidth: 60,
  },
  tabContent: {
    alignItems: 'center',
    gap: 0,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 0,
  },
});
