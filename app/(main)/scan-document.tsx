import { PowmIcon, PowmText } from '@/components';
import { powmColors } from '@/theme/powm-tokens';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
    Dimensions,
    Pressable,
    StatusBar,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const DOC_WIDTH = width * 0.9;
const DOC_HEIGHT = DOC_WIDTH * 0.63; // ID Card aspect ratio

export default function ScanDocumentScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
  }, [permission]);

  const handleTestValidate = () => {
    console.log("Document Validated (Test)");
    router.back();
  };

  if (!permission || !permission.granted) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      <CameraView style={StyleSheet.absoluteFill} facing="back">
        {/* Document Overlay */}
        <View style={styles.overlay}>
          <View style={styles.maskTop} />
          <View style={styles.maskMiddle}>
            <View style={styles.maskSide} />
            <View style={styles.docWindow}>
              {/* Document Corners */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.maskSide} />
          </View>
          <View style={styles.maskBottom}>
            <PowmText variant="text" color="rgba(255,255,255,0.8)" align="center" style={{ marginTop: 30 }}>
              Align your ID card within the frame
            </PowmText>

            {/* Test Validate Button */}
            <Pressable style={styles.testButton} onPress={handleTestValidate}>
              <PowmText variant="subtitleSemiBold" color={powmColors.white}>
                [TEST] Validate Document
              </PowmText>
            </Pressable>
          </View>
        </View>

        {/* Header / Close */}
        <View style={[styles.header, { top: insets.top + 10 }]}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <PowmIcon name="cross" size={20} color={powmColors.white} />
          </Pressable>
          <View style={styles.badge}>
            <PowmText variant="subtitleSemiBold" style={{ fontSize: 14 }}>Scan ID</PowmText>
          </View>
          <View style={{ width: 40 }} /> 
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  maskTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskMiddle: { flexDirection: 'row', height: DOC_HEIGHT },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center' },
  docWindow: { width: DOC_WIDTH, height: DOC_HEIGHT, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: powmColors.white, borderWidth: 4, borderRadius: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  header: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 10 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  testButton: { marginTop: 40, paddingVertical: 14, paddingHorizontal: 30, backgroundColor: powmColors.electricMain, borderRadius: 30 },
});
