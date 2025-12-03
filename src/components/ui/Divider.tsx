import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { powmColors } from '@/theme/powm-tokens';

/**
 * Divider Component
 *
 * Horizontal or vertical line separator.
 *
 * @example
 * <Divider />
 *
 * @example
 * <Divider orientation="vertical" height={40} />
 */

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  color?: string;
  thickness?: number;
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  color = powmColors.inactive,
  thickness = 1,
  width = '100%',
  height,
  style,
}) => {
  const dividerStyle: ViewStyle = orientation === 'horizontal'
    ? {
        backgroundColor: color,
        width: width as any,
        height: thickness,
        ...(style as ViewStyle),
      }
    : {
        backgroundColor: color,
        width: thickness,
        height: height || '100%',
        ...(style as ViewStyle),
      };

  return <View style={dividerStyle} />;
};

const styles = StyleSheet.create({});
