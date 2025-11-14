import {
  BackgroundImage,
  FootBar,
  PowmIcon,
  PowmText,
  Row,
  TicketCard,
} from '@/components/powm';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * History/Activity Screen
 *
 * Shows user's activity history including:
 * - Scanned tickets
 * - Third-party verifications
 * - Delete mode for removing history items
 */

interface ActivityItem {
  id: string;
  name: string;
  timestamp: string;
  date: string;
  type: 'trusted' | 'anonymous';
  iconColor: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    name: 'Instagram',
    timestamp: '18h36',
    date: '17/08/2024',
    type: 'trusted',
    iconColor: powmColors.electricMain,
  },
  {
    id: '2',
    name: 'Youtube',
    timestamp: '18h36',
    date: '17/08/2024',
    type: 'trusted',
    iconColor: powmColors.electricMain,
  },
  {
    id: '3',
    name: 'Instagram',
    timestamp: '18h36',
    date: '17/08/2024',
    type: 'trusted',
    iconColor: powmColors.electricMain,
  },
  {
    id: '4',
    name: 'Tabac.fr',
    timestamp: '18h36',
    date: '17/08/2024',
    type: 'trusted',
    iconColor: powmColors.electricMain,
  },
  {
    id: '5',
    name: 'Harry H',
    timestamp: '18h36',
    date: '17/08/2024',
    type: 'anonymous',
    iconColor: '#B8860B',
  },
  {
    id: '6',
    name: 'Pornhub',
    timestamp: '18h36',
    date: '17/08/2024',
    type: 'trusted',
    iconColor: powmColors.electricMain,
  },
  {
    id: '7',
    name: 'TikTok',
    timestamp: '18h36',
    date: '17/08/2024',
    type: 'trusted',
    iconColor: powmColors.electricMain,
  },
];

export default function HistoryScreen() {
  const [deleteMode, setDeleteMode] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <BackgroundImage>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + powmSpacing.lg }]}
        >
        {/* Header */}
        <PowmText variant="title" style={styles.header}>
          Activity
        </PowmText>

        {/* Delete Activity Button */}
        {deleteMode && (
          <Pressable
            style={styles.deleteButton}
            onPress={() => setDeleteMode(false)}
          >
            <Row gap={powmSpacing.sm} align="center" justify="center">
              <PowmIcon name="cross" size={20} color={powmColors.white} />
              <PowmText variant="subtitleSemiBold">Delete activity</PowmText>
            </Row>
          </Pressable>
        )}

        {!deleteMode && (
          <Pressable
            style={styles.toggleDeleteButton}
            onPress={() => setDeleteMode(true)}
          >
            <PowmText variant="text" color={powmColors.electricMain}>
              Enable delete mode
            </PowmText>
          </Pressable>
        )}

        {/* Activity List */}
        <View style={styles.activityList}>
          {MOCK_ACTIVITY.map((item) => (
            <TicketCard
              key={item.id}
            icon={{
              name: 'powmLogo',
              backgroundColor: item.type === 'trusted'
                    ? powmColors.activeElectricFade
                    : powmColors.orangeElectricFade,
              color: item.type === 'trusted'
                    ? powmColors.activeElectricMain
                    : powmColors.orangeElectricMain,
              size: 48,
            }}
              title={item.name}
              subtitle={`${item.timestamp} ${item.date}`}
              tag={{
                label: item.type === 'trusted' ? 'Trusted by Powm' : 'Anonymous',
                backgroundColor:
                  item.type === 'trusted'
                    ? powmColors.activeElectricFade
                    : '#B8860B',
              }}
              expandable={item.type === 'anonymous' && item.name === 'Harry H'}
              expandedContent={
                item.type === 'anonymous' && item.name === 'Harry H'
                  ? 'Harry H checked your Name and Age on this ticket XXXXXXX XXXXX'
                  : undefined
              }
              style={{ marginBottom: powmSpacing.xs }}
            />
          ))}
        </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <FootBar />
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
  deleteButton: {
    backgroundColor: powmColors.deletionRedHard,
    borderRadius: powmRadii.md,
    paddingVertical: powmSpacing.base,
    paddingHorizontal: powmSpacing.lg,
    marginBottom: powmSpacing.lg,
  },
  toggleDeleteButton: {
    alignSelf: 'flex-end',
    marginBottom: powmSpacing.md,
  },
  activityList: {
    gap: powmSpacing.xs,
    marginBottom: powmSpacing.xl,
  },
});
