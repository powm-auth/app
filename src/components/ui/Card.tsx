import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, StyleProp } from 'react-native';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';

/**
 * Card Component
 *
 * Styled container card following Powm design system.
 * Used for grouping related content with consistent styling.
 *
 * @example
 * <Card>
 *   <Text>Card content</Text>
 * </Card>
 *
 * @example
 * // Pressable card
 * <Card onPress={() => navigate('/details')}>
 *   <Text>Tap me</Text>
 * </Card>
 */

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'alt';
  padding?: number;
  borderRadius?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  padding = powmSpacing.base,
  borderRadius = powmRadii.md,
}) => {
  const baseStyle: ViewStyle = {
    ...styles.base,
    backgroundColor:
      variant === 'default' ? powmColors.mainBackgroundAlt : powmColors.mainBackground,
    padding,
    borderRadius,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [baseStyle, style, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[baseStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
  },
  pressed: {
    opacity: 0.8,
  },
});
