import {
  BackgroundImage,
  Card,
  Column,
  PowmIcon,
  PowmText,
  Row,
} from '@/components/powm';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { PanResponder, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Profile Screen
 *
 * User profile with sections for:
 * - My informations (Personal info, Identity documents)
 * - Account (My data, Account, Notifications)
 * - Support (Help)
 */

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  icon: string;
  label: string;
  onPress: () => void;
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'My informations',
    items: [
      {
        icon: 'face',
        label: 'Personnal informations',
        onPress: () => console.log('Personal info'),
      },
      {
        icon: 'id',
        label: 'Identity documents',
        onPress: () => console.log('Identity documents'),
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        icon: 'data',
        label: 'My data',
        onPress: () => console.log('My data'),
      },
      {
        icon: 'profile',
        label: 'Account',
        onPress: () => console.log('Account'),
      },
      {
        icon: 'bell',
        label: 'Notifications',
        onPress: () => console.log('Notifications'),
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        icon: 'face',
        label: 'Help',
        onPress: () => console.log('Help'),
      },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Swipe vers la gauche pour revenir à Home (Optionnel avec le fade, mais conservé ici)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => {
        const { dx, dy } = gesture;
        return Math.abs(dx) > 20 && Math.abs(dy) < 10;
      },
      onPanResponderRelease: (_evt, gesture) => {
        const { dx } = gesture;
        if (dx < -50) {
          router.push('/');
        }
      },
    })
  ).current;

  return (
    <BackgroundImage>
      <View style={styles.container} {...panResponder.panHandlers}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + powmSpacing.lg }]}
        >
          {/* Header */}
          <PowmText variant="title" style={styles.header}>
            Profile
          </PowmText>

          {/* Menu Sections */}
          <Column gap={powmSpacing.lg}>
            {MENU_SECTIONS.map((section, sectionIndex) => (
              <Column key={sectionIndex} gap={powmSpacing.xs}>
                <PowmText variant="subtitle" style={styles.sectionTitle}>
                  {section.title}
                </PowmText>

                {section.items.map((item, itemIndex) => (
                  <Card
                    key={itemIndex}
                    onPress={item.onPress}
                    style={styles.menuCard}
                    variant="alt"
                  >
                    <Row gap={powmSpacing.base} align="center" justify="space-between">
                      {/* Icon and Label */}
                      <Row gap={powmSpacing.base} align="center" flex={1}>
                        <View style={styles.menuIcon}>
                          <PowmIcon name={item.icon as any} size={24} color={powmColors.white} />
                        </View>
                        <PowmText variant="subtitleSemiBold">{item.label}</PowmText>
                      </Row>

                      {/* Chevron */}
                      <PowmIcon name="chevron" size={20} color={powmColors.inactive} />
                    </Row>
                  </Card>
                ))}
              </Column>
            ))}
          </Column>
        </ScrollView>
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: powmSpacing.lg,
    paddingBottom: powmSpacing.xxl,
  },
  header: {
    marginBottom: powmSpacing.lg,
  },
  sectionTitle: {
    marginBottom: powmSpacing.sm,
  },
  menuCard: {
    padding: 13,
    backgroundColor: powmColors.rowBackground,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: powmRadii.full,
    backgroundColor: powmColors.electricMain,
    alignItems: 'center',
    justifyContent: 'center',
  },
});