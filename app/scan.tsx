import { PowmIcon, PowmText } from '@/components';
import { CameraPermissionGuard } from '@/components/scanner/CameraPermissionGuard';
import { ScannerOverlay } from '@/components/scanner/ScannerOverlay';
import { powmColors } from '@/theme/powm-tokens';
import { CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scanAnim = useRef(new Animated.Value(0)).current;

  // PREVENT MULTIPLE SCANS
  // This state locks the scanner after the first read to prevent the "freeze" bug
  const [scanned, setScanned] = useState(false);

  // RESET ON FOCUS
  // Automatically re-enable the scanner when the user comes back to this screen
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
    }, [])
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_SIZE],
  });

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    console.log('Scanned:', data);

    try {
      // ---------------------------------------------------------
      // @Jean - IMPLEMENT BACKEND LOGIC HERE
      // ---------------------------------------------------------

      // For now, just navigate:
      router.push('/validate-identity');

    } catch (error) {
      console.error("Scan failed", error);
      setScanned(false); 
    }
  };

  return (
    <CameraPermissionGuard>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent />
        
        <CameraView 
          style={StyleSheet.absoluteFill} 
          facing="back" 
          // Disable the listener if we have already scanned
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        >
          
          <ScannerOverlay windowSize={SCAN_SIZE}>
            {/* Markers */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Laser */}
            <Animated.View style={[styles.laserContainer, { transform: [{ translateY }] }]}>
              <LinearGradient 
                colors={['rgba(160,107,255,0)', 'rgba(160,107,255,0.8)', 'rgba(160,107,255,0)']} 
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} 
                style={styles.laserLine} 
              />
            </Animated.View>
          </ScannerOverlay>

          {/* Controls Overlay (Header) */}
          <View style={[styles.header, { top: insets.top + 10 }]}>
            <Pressable onPress={() => router.back()} style={styles.iconButton}>
               <PowmIcon name="cross" size={20} color={powmColors.white} />
            </Pressable>
            <View style={styles.badge}>
              <PowmText variant="subtitleSemiBold" style={{ fontSize: 14 }}>Scan Code</PowmText>
            </View>
            <View style={{ width: 40 }} /> 
          </View>

          {/* Bottom Hint */}
          <View style={styles.bottomHint}>
             <PowmText variant="text" color="rgba(255,255,255,0.7)">
               Align the QR code within the frame
             </PowmText>
             
             {/* Test Button (Respects scanned state) */}
             <Pressable 
               style={styles.testButton} 
               onPress={() => {
                 if (!scanned) {
                   setScanned(true);
                   router.push('/validate-identity');
                 }
               }}
             >
               <PowmText variant="text" color={powmColors.white}>[TEST] Validate</PowmText>
             </Pressable>
          </View>

        </CameraView>
      </View>
    </CameraPermissionGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: powmColors.electricMain, borderWidth: 4, borderRadius: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  laserContainer: { width: '100%', position: 'absolute', top: 0, alignItems: 'center' },
  laserLine: { height: 2, width: '90%', borderRadius: 1 },
  header: { position: 'absolute', left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bottomHint: { position: 'absolute', bottom: 100, width: '100%', alignItems: 'center' },
  testButton: { marginTop: 20, padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }
});