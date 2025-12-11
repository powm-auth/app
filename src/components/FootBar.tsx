import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PowmIcon, PowmIconName } from './ui/PowmIcon';
import { PowmText } from './ui/PowmText';
import { Row } from './ui/Row';

interface FootBarTab {
  name: string;
  label: string;
  icon: PowmIconName;
  route: string;
}

const TABS: FootBarTab[] = [
  { name: 'history', label: 'History', icon: 'clock', route: '/history' },
  { name: 'home', label: 'Home', icon: 'home', route: '/home' },
  { name: 'profile', label: 'Profile', icon: 'profile', route: '/profile' },
];

const getIndex = (route: string) => {
  if (route.includes('/history')) return 0;
  if (route === '/home' || route === '') return 1;
  if (route.includes('/profile')) return 2;
  return 1;
};

export const FootBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Hide footer on full-screen flows
  const isHidden = pathname.includes('/scan') || pathname.includes('/validate-identity');

  const isActive = (route: string) => {
    if (route === '/home') {
      return pathname === '/home' || pathname === '/home/';
    }
    return pathname.includes(route);
  };

  return (
    <View
      style={[
        styles.container,
        // Collapse padding when hidden
        { paddingBottom: isHidden ? 0 : insets.bottom },
        // Collapse height/opacity when hidden (prevents unmount state loss)
        isHidden && styles.hidden
      ]}
    >
      <Row justify="center" align="center" style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const active = isActive(tab.route);
          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                if (pathname === tab.route) return;

                const currentIndex = getIndex(pathname);
                const targetIndex = getIndex(tab.route);
                let transition: string | undefined;
                if (targetIndex > currentIndex) transition = 'slide_from_right';
                else if (targetIndex < currentIndex) transition = 'slide_from_left';

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
    paddingTop: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  hidden: {
    height: 0,
    borderTopWidth: 0,
    paddingTop: 0,
    opacity: 0,
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