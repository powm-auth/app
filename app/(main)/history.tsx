import {
  AnimatedEntry,
  BackgroundImage,
  GlassCard,
  PowmText,
  Row,
} from '@/components';
import { ActivityItem, HistoryItem } from '@/components/history/HistoryItem';
import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  LayoutAnimation,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Mock Data
const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', name: 'Instagram', time: '18:36', dateLabel: 'Today', type: 'trusted', iconColor: powmColors.activeElectricMain },
  { id: '2', name: 'Youtube', time: '16:20', dateLabel: 'Today', type: 'trusted', iconColor: '#FF0000' },
  { id: '5', name: 'Harry H', time: '14:05', dateLabel: 'Today', type: 'anonymous', iconColor: '#B8860B' },
  { id: '3', name: 'Tabac.fr', time: '09:12', dateLabel: 'Yesterday', type: 'trusted', iconColor: powmColors.orangeElectricMain },
  { id: '4', name: 'Pornhub', time: '23:45', dateLabel: 'Yesterday', type: 'trusted', iconColor: powmColors.activeElectricMain },
  { id: '7', name: 'TikTok', time: '20:30', dateLabel: 'Aug 15', type: 'trusted', iconColor: '#000000' },
];

export default function HistoryScreen() {
  const [activities, setActivities] = useState<ActivityItem[]>(MOCK_ACTIVITY);
  const [isEditing, setIsEditing] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Group activities
  const groupedActivities = activities.reduce((acc, item) => {
    if (!acc[item.dateLabel]) acc[item.dateLabel] = [];
    acc[item.dateLabel].push(item);
    return acc;
  }, {} as Record<string, ActivityItem[]>);

  const toggleEditMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsEditing(!isEditing);
  };

  const handleDeleteItem = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setActivities(prev => prev.filter(i => i.id !== id));
  };

  const handleClearAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setActivities([]);
    setIsEditing(false);
  };

  // Swipe Back Gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => {
        return Math.abs(gesture.dx) > 30 && Math.abs(gesture.dy) < 20;
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dx > 50) {
          router.push('/');
        }
      },
    })
  ).current;

  // Header Action Button (Edit / Done)
  const HeaderAction = activities.length > 0 ? (
    <Pressable onPress={toggleEditMode} style={styles.editButton} hitSlop={10}>
      <PowmText
        variant="text"
        color={isEditing ? powmColors.electricMain : powmColors.gray}
        style={{ fontWeight: '600', fontSize: 13 }}
      >
        {isEditing ? 'Done' : 'Edit'}
      </PowmText>
    </Pressable>
  ) : null;

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
          {/* Header - Matching index.tsx style */}
          <Row justify="space-between" align="center" style={styles.header}>
            <PowmText variant="title">History</PowmText>
            {/* Show Edit Button or Spacer to maintain layout */}
            {HeaderAction || <View style={{ width: 48, height: 48 }} />}
          </Row>

          {/* Empty State */}
          {activities.length === 0 && (
            <AnimatedEntry>
              <View style={styles.emptyState}>
                <PowmText variant="subtitle" color={powmColors.gray}>No activity yet</PowmText>
                <PowmText variant="text" color={powmColors.inactive} align="center" style={{ marginTop: 8 }}>
                  Your verification history will appear here.
                </PowmText>
              </View>
            </AnimatedEntry>
          )}

          {/* Clear All Option */}
          {isEditing && activities.length > 0 && (
            <Pressable onPress={handleClearAll} style={styles.clearAllContainer}>
              <PowmText variant="text" color={powmColors.deletionRedHard} style={{ fontWeight: 'bold' }}>
                Clear all history
              </PowmText>
            </Pressable>
          )}

          {/* Grouped List */}
          <View style={styles.listContainer}>
            {Object.entries(groupedActivities).map(([dateLabel, items], groupIndex) => (
              <AnimatedEntry key={dateLabel} index={groupIndex}>
                <View style={styles.groupContainer}>
                  <PowmText variant="subtitleSemiBold" color={powmColors.gray} style={styles.groupTitle}>
                    {dateLabel}
                  </PowmText>

                  {/* Using GlassCard as the Group Container (Revolut Style) */}
                  <GlassCard padding={0}>
                    {items.map((item, index) => (
                      <HistoryItem
                        key={item.id}
                        item={item}
                        isEditing={isEditing}
                        onDelete={handleDeleteItem}
                        isLast={index === items.length - 1}
                      />
                    ))}
                  </GlassCard>
                </View>
              </AnimatedEntry>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: powmSpacing.lg },
  header: {
    marginBottom: powmSpacing.xl, // Updated to XL to match index.tsx
    height: 48, // Updated to 48 to match index.tsx
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
  listContainer: { gap: powmSpacing.xl },
  groupContainer: { gap: powmSpacing.sm },
  groupTitle: {
    fontSize: 14,
    marginLeft: 6,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  clearAllContainer: {
    alignItems: 'center',
    marginBottom: powmSpacing.md,
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    opacity: 0.8,
  },
});
