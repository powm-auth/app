import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
  ViewStyle,
} from 'react-native';
import { Column } from './Column';
import { PowmIcon, PowmIconName } from './PowmIcon';
import { PowmText } from './PowmText';
import { Row } from './Row';

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * TicketCard Component
 *
 * Reusable card component for displaying tickets, activity items, etc.
 * Features Lovable-style animations:
 * - Staggered entrance (slide up + fade)
 * - Scale on press
 * - Smooth expansion
 */

export interface TicketCardIcon {
  name: PowmIconName;
  backgroundColor: string;
  color?: string;
  size?: number;
}

export interface TicketCardTag {
  label: string;
  backgroundColor: string;
}

export interface TicketCardProps {
  icon: TicketCardIcon;
  title: string;
  subtitle?: string;
  tag?: TicketCardTag;
  showSeeButton?: boolean;
  onSeePress?: () => void;
  expandable?: boolean;
  expandedContent?: string | React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  /** Index for staggered entrance animation delay */
  index?: number;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  icon,
  title,
  subtitle,
  tag,
  showSeeButton,
  onSeePress,
  expandable,
  expandedContent,
  onPress,
  style,
  index = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation Values
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Entrance Animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay: index * 80,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    if (expandable) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsExpanded(!isExpanded);
    } else if (onPress) {
      onPress();
    }
  };

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const handleSeePress = (e: any) => {
    e.stopPropagation();
    onSeePress?.();
  };

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
        style, // Apply style to the wrapper to ensure layout consistency
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        <Row gap={powmSpacing.base} align="center" justify="space-between">
          {/* Left: Icon + Title + Subtitle */}
          <Row gap={powmSpacing.base} align="center" flex={1}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: icon.backgroundColor },
              ]}
            >
              <PowmIcon
                name={icon.name}
                size={icon.size || 32}
                color={icon.color || powmColors.white}
              />
            </View>
            <Column flex={1} gap={powmSpacing.xs}>
              <PowmText variant="subtitleSemiBold">{title}</PowmText>
              {subtitle && (
                <PowmText variant="text" color={powmColors.inactive}>
                  {subtitle}
                </PowmText>
              )}
              {/* Expanded content */}
              {expandable && isExpanded && expandedContent && (
                <View style={styles.expandedContentContainer}>
                  {typeof expandedContent === 'string' ? (
                    <PowmText
                      variant="text"
                      color={powmColors.inactive}
                      style={styles.expandedText}
                    >
                      {expandedContent}
                    </PowmText>
                  ) : (
                    expandedContent
                  )}
                </View>
              )}
            </Column>
          </Row>

          {/* Right: Tag or See Button */}
          {tag && (
            <View style={[styles.tag, { backgroundColor: tag.backgroundColor }]}>
              <PowmText
                variant="text"
                color={powmColors.white}
                style={styles.tagText}
              >
                {tag.label}
              </PowmText>
            </View>
          )}

          {showSeeButton && (
            <Pressable
              onPress={handleSeePress}
              hitSlop={10}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Row gap={4} align="center">
                <PowmText
                  variant="text"
                  color={powmColors.activeElectricMain}
                  style={{ fontWeight: '600' }}
                >
                  see
                </PowmText>
                <PowmIcon
                  name="qrcode"
                  size={14}
                  color={powmColors.activeElectricMain}
                />
              </Row>
            </Pressable>
          )}
        </Row>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: powmColors.rowBackground,
    borderRadius: powmRadii.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: powmRadii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: powmRadii.sm,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  expandedContentContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  expandedText: {
    fontSize: 12,
    lineHeight: 18,
  },
});