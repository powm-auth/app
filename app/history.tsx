import {
  BackgroundImage,
  PowmIcon,
  PowmText,
  Row,
  TicketCard,
} from '@/components/powm';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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
  const [activities, setActivities] = useState<ActivityItem[]>(MOCK_ACTIVITY);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Gestion suppression de l’historique
  const handlePressIn = () => {
    progress.stopAnimation(() => {
      Animated.timing(progress, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setShowDeleteConfirm(true);
        }
      });
    });
  };

  const handlePressOut = () => {
    progress.stopAnimation(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  };

  const handleConfirmDelete = () => {
    setActivities([]);
    setShowDeleteConfirm(false);
    progress.setValue(0);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    progress.setValue(0);
  };

  // Swipe vers la droite (retour à Home)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => {
        const { dx, dy } = gesture;
        return Math.abs(dx) > 20 && Math.abs(dy) < 10;
      },
      onPanResponderRelease: (_evt, gesture) => {
        const { dx } = gesture;
        if (dx > 50) {
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
            Activity
          </PowmText>
          {/* Delete Activity Button */}
          <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.deleteButton}>
            <Animated.View
              style={[
                styles.deleteProgress,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
            <Row gap={powmSpacing.sm} align="center" style={styles.deleteButtonContent}>
              <PowmIcon name="cross" size={20} color={powmColors.white} />
              <PowmText variant="subtitleSemiBold">Delete activity</PowmText>
            </Row>
          </Pressable>

          {/* Activity List */}
          <View style={styles.activityList}>
            {activities.map((item) => (
              <TicketCard
                key={item.id}
                icon={{
                  name: 'powmLogo',
                  backgroundColor:
                    item.type === 'trusted'
                      ? powmColors.activeElectricFade
                      : powmColors.orangeElectricFade,
                  color:
                    item.type === 'trusted'
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

        {/* Confirmation Popup */}
        {showDeleteConfirm && (
          <>
            <Pressable style={styles.overlay} onPress={handleCancelDelete} />
            <View style={styles.confirmPopup}>
              <PowmText variant="subtitle" style={styles.confirmTitle}>
                Are you sure?
              </PowmText>
              <PowmText variant="text" color={powmColors.inactive} style={styles.confirmText}>
                This will delete your activity history.
              </PowmText>
              <Row gap={powmSpacing.md} style={styles.confirmButtons}>
                <Pressable
                  style={[styles.confirmButton, styles.noButton]}
                  onPress={handleCancelDelete}
                >
                  <Row gap={powmSpacing.sm} align="center">
                    <PowmIcon name="cross" size={20} color={powmColors.white} />
                    <PowmText variant="subtitleSemiBold">No</PowmText>
                  </Row>
                </Pressable>
                <Pressable
                  style={[styles.confirmButton, styles.yesButton]}
                  onPress={handleConfirmDelete}
                >
                  <Row gap={powmSpacing.sm} align="center">
                    <PowmIcon name="check" size={20} color={powmColors.white} />
                    <PowmText variant="subtitleSemiBold">Yes</PowmText>
                  </Row>
                </Pressable>
              </Row>
            </View>
          </>
        )}
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
    height: 56,
    overflow: 'hidden',
  },
  deleteProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: powmColors.deletionRedAlt,
    borderRadius: powmRadii.md,
  },
  activityList: {
    gap: powmSpacing.xs,
    marginBottom: powmSpacing.xl,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 998,
  },
  confirmPopup: {
    position: 'absolute',
    top: '35%',
    left: powmSpacing.xl,
    right: powmSpacing.xl,
    backgroundColor: '#1A1824',
    borderRadius: powmRadii.lg,
    padding: powmSpacing.xl,
    zIndex: 999,
  },
  confirmTitle: {
    marginBottom: powmSpacing.md,
    textAlign: 'center',
  },
  confirmText: {
    marginBottom: powmSpacing.xl,
    textAlign: 'center',
  },
  confirmButtons: {
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: powmSpacing.md,
    paddingHorizontal: powmSpacing.lg,
    borderRadius: powmRadii.md,
    alignItems: 'center',
  },
  noButton: {
    backgroundColor: powmColors.mainBackgroundAlt,
  },
  yesButton: {
    backgroundColor: powmColors.electricMain,
  },
  deleteButtonContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});