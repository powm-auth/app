import { PowmIcon, PowmIconName } from './PowmIcon';
import { PowmText } from './PowmText';
import { Row } from './Row';
import { powmColors, powmRadii } from '@/theme/powm-tokens';
import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: PowmIconName;
  style?: ViewStyle;
  disabled?: boolean;
}

/**
 * Standard Action Button.
 * Primary: Electric Fade background with border.
 * Secondary: Main Background Alt.
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  style,
  disabled = false,
}) => {
  const buttonStyles = [
    styles.base,
    variant === 'primary' ? styles.primary : styles.secondary,
    disabled && styles.disabled,
    style,
  ];

  return (
    <Pressable onPress={onPress} style={buttonStyles} disabled={disabled}>
      <Row gap={8} align="center">
        {icon && <PowmIcon name={icon} size={18} color={powmColors.white} />}
        <PowmText variant="subtitleSemiBold">{title}</PowmText>
      </Row>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: powmRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: powmColors.electricFade,
    borderWidth: 1,
    borderColor: powmColors.electricMain,
  },
  secondary: {
    backgroundColor: powmColors.mainBackgroundAlt,
  },
  disabled: {
    opacity: 0.5,
  },
});
