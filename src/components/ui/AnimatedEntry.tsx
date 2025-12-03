import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';

interface AnimatedEntryProps {
  children: React.ReactNode;
  index?: number;
  style?: ViewStyle;
  delay?: number;
  duration?: number;
  slideDistance?: number;
}

/**
 * Standard "Slide Up + Fade In" animation wrapper.
 * Used for lists, cards, and entry elements.
 */
export const AnimatedEntry: React.FC<AnimatedEntryProps> = ({
  children,
  index = 0,
  style,
  delay = 100,
  duration = 500,
  slideDistance = 50,
}) => {
  const translateY = useRef(new Animated.Value(slideDistance)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const itemDelay = index * delay;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: duration,
        delay: itemDelay,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration - 100, // Slightly faster fade
        delay: itemDelay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, delay, duration, slideDistance, translateY, opacity]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
};
