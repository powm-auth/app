import {
  AnimatedEntry,
  BackgroundImage,
  Column,
  GlassCard,
  ListItem,
  PowmIconName,
  PowmText,
} from '@/components';
import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import {
  PanResponder,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  icon: PowmIconName;
  label: string;
  onPress: () => void;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const menuSections: MenuSection[] = [
    {
      title: 'My informations',
      items: [
        {
          icon: 'face',
          label: 'Personal information',
          onPress: () => router.push('/personal-info'),
        },
        {
          icon: 'id',
          label: 'Identity documents',
          onPress: () => router.push('/identity-documents'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: 'data',
          label: 'My data',
          onPress: () => router.push('/my-data'),
        },
        {
          icon: 'profile',
          label: 'Account',
          onPress: () => router.push('/account'),
        },
        {
          icon: 'bell',
          label: 'Notifications',
          onPress: () => router.push('/notifications'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'face',
          label: 'Help',
          onPress: () => router.push('/help'),
        },
      ],
    },
  ];

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => {
        const { dx, dy } = gesture;
        return Math.abs(dx) > 20 && Math.abs(dy) < 10;
      },
      onPanResponderRelease: (_evt, gesture) => {
        const { dx } = gesture;
        if (dx < -50) {
          router.push('/home');
        }
      },
    })
  ).current;

  return (
    <BackgroundImage>
      <View style={styles.container} {...panResponder.panHandlers}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + powmSpacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <PowmText variant="title" style={styles.header}>
            Profile
          </PowmText>

          <Column gap={powmSpacing.xl}>
            {menuSections.map((section, sectionIndex) => {
              const baseIndex = menuSections.slice(0, sectionIndex).reduce(
                (acc, s) => acc + s.items.length,
                0
              );

              return (
                <View key={sectionIndex} style={styles.groupContainer}>
                  <PowmText
                    variant="subtitleSemiBold"
                    color={powmColors.gray}
                    style={styles.groupTitle}
                  >
                    {section.title}
                  </PowmText>

                  <GlassCard padding={0}>
                    {section.items.map((item, itemIndex) => (
                      <AnimatedEntry
                        key={itemIndex}
                        index={baseIndex + itemIndex}
                        slideDistance={30}
                      >
                        <View>
                          <ListItem
                            title={item.label}
                            icon={item.icon}
                            onPress={item.onPress}
                            showChevron
                          />
                          {itemIndex < section.items.length - 1 && (
                            <View style={styles.separator} />
                          )}
                        </View>
                      </AnimatedEntry>
                    ))}
                  </GlassCard>
                </View>
              );
            })}
          </Column>

          <View style={{ height: 100 }} />
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
  },
  header: {
    marginBottom: powmSpacing.lg,
    marginLeft: 4,
  },
  groupContainer: {
    gap: powmSpacing.sm,
  },
  groupTitle: {
    fontSize: 14,
    marginLeft: 6,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 76,
  },
});
