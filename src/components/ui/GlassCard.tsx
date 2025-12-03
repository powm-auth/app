import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'dark';
  padding?: number;
}

/**
 * Standard Glassmorphism Card.
 * Uses the centralized "glass" tokens.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 16,
}) => {
  const containerStyle: ViewStyle = {
    padding,
    backgroundColor:
      variant === 'dark'
        ? 'rgba(20, 18, 28, 0.8)' // Darker variant if needed
        : powmColors.glass.background,
    borderColor: powmColors.glass.border,
    borderWidth: 1,
    borderRadius: powmRadii.xl,
    ...(style as ViewStyle),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          containerStyle,
          pressed && { backgroundColor: powmColors.glass.pressed },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};
