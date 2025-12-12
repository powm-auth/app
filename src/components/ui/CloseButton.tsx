import { powmColors } from '@/theme/powm-tokens';
import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { PowmIcon } from './PowmIcon';

interface CloseButtonProps {
    onPress: () => void;
    color?: string;
    size?: number;
    style?: StyleProp<ViewStyle>;
}

/**
 * CloseButton Component
 * 
 * Reusable close/dismiss button for modals and overlays.
 * Renders an X icon with consistent touch target.
 */
export const CloseButton: React.FC<CloseButtonProps> = ({
    onPress,
    color = powmColors.white,
    size = 24,
    style,
}) => {
    return (
        <Pressable onPress={onPress} hitSlop={8} style={style}>
            <PowmIcon name="cross" size={size} color={color} />
        </Pressable>
    );
};
