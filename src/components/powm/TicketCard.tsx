import React, { useState } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { PowmIcon, PowmIconName } from './PowmIcon';
import { PowmText } from './PowmText';
import { Row } from './Row';
import { Column } from './Column';

/**
 * TicketCard Component
 *
 * Reusable card component for displaying tickets, activity items, etc.
 * Supports icons, tags, expandable content, and "see" button.
 *
 * @example
 * // Simple card with icon and title
 * <TicketCard
 *   icon={{ name: 'powmLogo', backgroundColor: powmColors.electricFade }}
 *   title="Name"
 *   subtitle="First and Lastname Proof"
 * />
 *
 * @example
 * // Card with tag and expandable content
 * <TicketCard
 *   icon={{ name: 'face', backgroundColor: '#B8860B' }}
 *   title="Harry H"
 *   subtitle="18h36 17/08/2024"
 *   tag={{ label: 'Anonymous', backgroundColor: '#B8860B' }}
 *   expandable
 *   expandedContent="Harry H checked your Name and Age on this ticket XXXXXXX XXXXX"
 * />
 *
 * @example
 * // Card with "see" button
 * <TicketCard
 *   icon={{ name: 'powmLogo', backgroundColor: powmColors.electricFade }}
 *   title="Name"
 *   subtitle="First and Lastname Proof"
 *   showSeeButton
 *   onSeePress={() => console.log('See pressed')}
 * />
 */

export interface TicketCardIcon {
  /** Icon name from PowmIcon */
  name: PowmIconName;
  /** Background color of the circular icon container */
  backgroundColor: string;
  /** Icon color (default: white) */
  color?: string;
  /** Icon size (default: 32) */
  size?: number;
}

export interface TicketCardTag {
  /** Tag label text */
  label: string;
  /** Tag background color */
  backgroundColor: string;
}

export interface TicketCardProps {
  /** Icon configuration */
  icon: TicketCardIcon;
  /** Card title */
  title: string;
  /** Card subtitle (optional) */
  subtitle?: string;
  /** Tag configuration (optional) */
  tag?: TicketCardTag;
  /** Show "see" button with QR icon (optional) */
  showSeeButton?: boolean;
  /** Callback when "see" button is pressed */
  onSeePress?: () => void;
  /** Make card expandable on press (optional) */
  expandable?: boolean;
  /** Content to show when expanded - can be string or React node (optional) */
  expandedContent?: string | React.ReactNode;
  /** Callback when card is pressed (for non-expandable cards) */
  onPress?: () => void;
  /** Custom style */
  style?: ViewStyle;
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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePress = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    } else if (onPress) {
      onPress();
    }
  };

  const handleSeePress = (e: any) => {
    e.stopPropagation(); // Prevent card press when clicking "see"
    onSeePress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Row gap={powmSpacing.base} align="center" justify="space-between">
        {/* Left: Icon + Title + Subtitle */}
        <Row gap={powmSpacing.base} align="center" flex={1}>
          <View style={[styles.iconContainer, { backgroundColor: icon.backgroundColor }]}>
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
            {/* Expanded content (only visible when expanded) */}
            {expandable && isExpanded && expandedContent && (
              typeof expandedContent === 'string' ? (
                <PowmText
                  variant="text"
                  color={powmColors.inactive}
                  style={styles.expandedText}
                >
                  {expandedContent}
                </PowmText>
              ) : (
                <View style={styles.expandedText}>{expandedContent}</View>
              )
            )}
          </Column>
        </Row>

        {/* Right: Tag or See Button */}
        {tag && (
          <View style={[styles.tag, { backgroundColor: tag.backgroundColor }]}>
            <PowmText variant="text" color={powmColors.white} style={styles.tagText}>
              {tag.label}
            </PowmText>
          </View>
        )}

        {showSeeButton && (
          <Pressable onPress={handleSeePress}>
            <Row gap={4} align="center">
              <PowmText variant="text" color={powmColors.activeElectricMain}>
                see
              </PowmText>
              <PowmIcon name="qrcode" size={14} color={powmColors.activeElectricMain} />
            </Row>
          </Pressable>
        )}
      </Row>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 13,
    backgroundColor: powmColors.rowBackground,
    borderRadius: powmRadii.md,
  },
  pressed: {
    opacity: 0.8,
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
  },
  expandedText: {
    marginTop: 4,
    fontSize: 10,
  },
});
