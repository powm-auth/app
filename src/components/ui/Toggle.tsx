import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle, Easing } from 'react-native';
import { powmColors } from '@/theme/powm-tokens';

/**
 * Toggle Component
 *
 * A smooth animated toggle switch following Powm design system.
 * Active state uses electric purple, inactive state uses gray.
 *
 * @example
 * <Toggle value={isEnabled} onValueChange={setIsEnabled} />
 */

export interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  style?: ViewStyle;
}

export const Toggle: React.FC<ToggleProps> = ({ value, onValueChange, style }) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 250,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const trackBackgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [powmColors.mainBackgroundAlt, powmColors.electricFade],
  });

  const thumbBackgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [powmColors.inactive, powmColors.electricMain],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 17],
  });

  return (
    <Pressable onPress={() => onValueChange(!value)} style={[styles.container, style]}>
      <Animated.View style={[styles.track, { backgroundColor: trackBackgroundColor }]}>
        <Animated.View style={[styles.thumb, { backgroundColor: thumbBackgroundColor, transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 45,
    height: 21,
    justifyContent: 'center',
  },
  track: {
    width: 45,
    height: 21,
    borderRadius: 10.5,
    padding: 4,
  },
  thumb: {
    width: 20,
    height: 13,
    borderRadius: 6.5,
  },
});
