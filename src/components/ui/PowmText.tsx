import React from 'react';
import { Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { powmTypography, powmColors } from '@/theme/powm-tokens';

/**
 * PowmText Component
 *
 * Text component using Powm typography tokens.
 * Automatically applies correct font family, size, and letter spacing.
 *
 * @example
 * <PowmText variant="title">Welcome</PowmText>
 *
 * @example
 * <PowmText variant="subtitle" color={powmColors.electricMain}>
 *   Section Title
 * </PowmText>
 */

export type PowmTextVariant =
  | 'title'
  | 'titleBold'
  | 'subtitle'
  | 'subtitleSemiBold'
  | 'text'
  | 'textSemiBold';

export interface PowmTextProps {
  children: React.ReactNode;
  variant?: PowmTextVariant;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'auto';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export const PowmText: React.FC<PowmTextProps> = ({
  children,
  variant = 'text',
  color = powmColors.white,
  align = 'left',
  style,
  numberOfLines,
}) => {
  const baseStyle: TextStyle = {
    ...powmTypography[variant],
    color,
    textAlign: align,
  };

  return (
    <Text style={[baseStyle, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({});
