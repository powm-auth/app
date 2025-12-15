import { powmColors, powmRadii } from '@/theme/powm-tokens';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'danger';
  padding?: number;
  transparent?: boolean; // ✅ NEW PROP
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 16,
  transparent = false // Default to false (standard glass background)
}) => {
  const cardStyles: StyleProp<ViewStyle> = [
    styles.container,
    {
      padding,
      // If transparent is true, override background to transparent
      backgroundColor: transparent ? 'transparent' : powmColors.glass.background
    },
    variant === 'danger' && styles.dangerBorder,
    style
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyles,
          // Only show pressed state if not transparent, or use a very light overlay
          pressed && { backgroundColor: transparent ? 'rgba(255,255,255,0.02)' : powmColors.glass.pressed }
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    // Default background is handled in component logic now
    borderRadius: powmRadii.xl,
    borderWidth: 1,
    borderColor: powmColors.glass.border,
    overflow: 'hidden',
  },
  dangerBorder: {
    borderColor: 'rgba(255, 69, 58, 0.3)',
  }
});