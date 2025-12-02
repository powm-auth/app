import { PowmIcon, PowmText } from '@/components/powm';
import { powmColors, powmRadii } from '@/theme/powm-tokens';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7; // Size of the scanning window

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Scanning line animation
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    // Infinite up/down scanning animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Interpolate value for scanning line position
  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_SIZE], 
  });

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    console.log('Scanned:', data);
    // Add your logic here (e.g., vibrate, navigate, show modal)
    router.back(); // For now, just close scanner
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <PowmText variant="subtitle" align="center" style={{ marginBottom: 12 }}>
          We need your permission to use the camera
        </PowmText>
        <Pressable 
          style={styles.permissionButton} 
          onPress={requestPermission}
        >
           <PowmText variant="subtitleSemiBold">Grant Permission</PowmText>
        </Pressable>
        <Pressable 
          style={[styles.closeButtonTopLeft, { top: insets.top + 16 }]} 
          onPress={() => router.back()}
        >
          <PowmIcon name="cross" size={24} color={powmColors.white} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <CameraView 
        style={StyleSheet.absoluteFill} 
        facing="back"
        onBarcodeScanned={handleBarcodeScanned}
      >
        {/* Dark Overlay System */}
        <View style={styles.overlayContainer}>
          
          {/* Top Mask */}
          <View style={styles.maskTop} />
          
          {/* Middle Row (Mask Left + Scan Window + Mask Right) */}
          <View style={styles.maskMiddle}>
            <View style={styles.maskSide} />
            
            {/* The Scan Window */}
            <View style={styles.scanWindow}>
              {/* Corner Markers */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Animated Laser Line */}
              <Animated.View 
                style={[
                  styles.laserLineContainer,
                  { transform: [{ translateY }] }
                ]}
              >
                <LinearGradient
                  colors={['rgba(160, 107, 255, 0)', 'rgba(160, 107, 255, 0.8)', 'rgba(160, 107, 255, 0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.laserLine}
                />
                <LinearGradient
                  colors={['rgba(160, 107, 255, 0)', 'rgba(160, 107, 255, 0.3)', 'rgba(160, 107, 255, 0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.laserGlow}
                />
              </Animated.View>
            </View>

            <View style={styles.maskSide} />
          </View>

          {/* Bottom Mask */}
          <View style={styles.maskBottom}>
             <PowmText variant="text" color="rgba(255,255,255,0.7)" style={{ marginTop: 32 }}>
               Align the QR code within the frame
             </PowmText>
          </View>

        </View>

        {/* Header Controls (Close Button) */}
        <View style={[styles.header, { top: insets.top + 10 }]}>
          <Pressable 
            onPress={() => router.back()} 
            style={styles.closeButton}
            hitSlop={20}
          >
            <View style={styles.blurButtonBg}>
               <PowmIcon name="cross" size={20} color={powmColors.white} />
            </View>
          </Pressable>
          
          <View style={styles.badgeContainer}>
            <PowmText variant="subtitleSemiBold" style={{ fontSize: 24 }}>Scan Code</PowmText>
          </View>
          
          <View style={{ width: 40 }} /> 
        </View>

      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: powmColors.mainBackground,
  },
  permissionButton: {
    backgroundColor: powmColors.electricMain,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: powmRadii.md,
  },
  
  // Overlay Masking System
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  maskMiddle: {
    flexDirection: 'row',
    height: SCAN_SIZE,
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  maskBottom: {
    flex: 1.2, // More space at bottom
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  },

  // Scan Window & Markers
  scanWindow: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: powmColors.electricMain,
    borderWidth: 4,
    borderRadius: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  // Laser Animation
  laserLineContainer: {
    width: '100%',
    position: 'absolute',
    top: 0,
    alignItems: 'center',
  },
  laserLine: {
    height: 2,
    width: '90%',
    borderRadius: 1,
  },
  laserGlow: {
    height: 40,
    width: '90%',
    marginTop: -20, // Center glow on line
    opacity: 0.6,
  },

  // Header Controls
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  closeButtonTopLeft: {
    position: 'absolute',
    left: 24,
    padding: 8,
  },
  closeButton: {
    // Container for hitSlop
  },
  blurButtonBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});