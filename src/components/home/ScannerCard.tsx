import { Column, PowmIcon, PowmText } from '@/components/ui';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ImageBackground, Pressable, StyleSheet, View } from 'react-native';

interface ScannerCardProps {
  onPress: () => void;
}

export const ScannerCard: React.FC<ScannerCardProps> = ({ onPress }) => {
  const gradientShine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientShine, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(gradientShine, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <ImageBackground
        source={require('@/assets/powm/illustrations/powm_draw.png')}
        style={styles.bg}
        imageStyle={styles.bgImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['#3b0764', '#1e1b4b', '#4c1d95']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.85 }]}
        />

        <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradientShine }]}>
          <LinearGradient
            colors={[
              'rgba(236, 72, 153, 0.5)',
              'rgba(139, 92, 246, 0.1)',
              'rgba(217, 70, 239, 0.5)',
            ]}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={styles.content}>
          <Column gap={powmSpacing.sm} style={{ alignItems: 'center' }}>
            <PowmText variant="subtitle" color="#e9d5ff">
              Share your Identity
            </PowmText>
            <PowmText variant="title" style={{ fontSize: 28, color: '#ffffff' }}>
              Scan QR Code
            </PowmText>
            <PowmText variant="text" color="#c0a0e0" align="center">
              Scan to securely share your information.
            </PowmText>

            <View style={styles.iconContainer}>
              <View style={styles.icon}>
                <PowmIcon name="qrcode" size={54} color={powmColors.white} />
              </View>
            </View>
          </Column>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: powmRadii.xl,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    backgroundColor: '#1e1b4b', // Fallback color behind image
  },
  bg: {
    borderRadius: powmRadii.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(236, 72, 153, 0.5)',
  },
  bgImage: {
    opacity: 0.9,
    transform: [{ translateX: -800 }, { translateY: -500 }, { scale: 0.4 }],
  },
  content: {
    padding: powmSpacing.lg,
    paddingVertical: powmSpacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: powmSpacing.md,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: powmRadii.full,
    backgroundColor: 'rgba(20, 18, 28, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});