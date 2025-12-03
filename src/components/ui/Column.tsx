import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

/**
 * Column Component
 *
 * Vertical flexbox container.
 * Simple wrapper for consistent column layouts.
 *
 * @example
 * <Column gap={12}>
 *   <Text>Item 1</Text>
 *   <Text>Item 2</Text>
 * </Column>
 */

export interface ColumnProps {
  children: React.ReactNode;
  gap?: number;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  style?: ViewStyle;
  flex?: number;
}

export const Column: React.FC<ColumnProps> = ({
  children,
  gap = 0,
  align = 'stretch',
  justify = 'flex-start',
  style,
  flex,
}) => {
  const columnStyle: ViewStyle = {
    ...styles.base,
    gap,
    alignItems: align,
    justifyContent: justify,
    ...(flex !== undefined && { flex }),
    ...(style as ViewStyle),
  };

  return <View style={columnStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'column',
  },
});
