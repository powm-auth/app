import { PowmIcon, PowmText, Row } from '@/components/powm';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Demande l’accès à la caméra au premier rendu
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    // état de permission encore en chargement
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // UI fallback si l’utilisateur refuse l’accès
    return (
      <View style={[styles.container, { backgroundColor: powmColors.mainBackground }]}>
        <View style={styles.permissionContent}>
          <PowmText
            variant="subtitle"
            style={{ textAlign: 'center', marginBottom: powmSpacing.md }}
          >
            We need access to your camera to scan Powm QRcodes.
          </PowmText>

          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <PowmText variant="subtitleSemiBold">Allow camera access</PowmText>
          </Pressable>

          <Pressable
            style={[styles.permissionButton, { marginTop: powmSpacing.md }]}
            onPress={() => router.back()}
          >
            <PowmText variant="subtitleSemiBold">Go back</PowmText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        {/* Overlay au-dessus du flux caméra */}
        <View style={styles.overlay}>
          {/* Bande du haut : fond noir transparent, croix + titre */}
          <View style={[styles.topOverlay, { paddingTop: insets.top + powmSpacing.lg }]}>
            <Row align="center" justify="space-between">
              <Pressable
                onPress={() => router.back()}
                style={styles.closeButton}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              >
                <PowmIcon name="cross" size={24} color={powmColors.white} />
              </Pressable>

              <View style={styles.titleContainer}>
                <PowmText variant="subtitle" style={styles.titleText}>
                  Scan a Powm
                </PowmText>
                <PowmText variant="subtitle" style={styles.titleText}>
                  QRcode
                </PowmText>
              </View>

              {/* Espace à droite pour équilibrer la croix */}
              <View style={styles.rightSpacer} />
            </Row>
          </View>

          {/* Centre : cadre transparent pour viser le QR code */}
          <View style={styles.centerOverlay}>
            <View style={styles.scanFrame} />
          </View>

          {/* Bande du bas : noir transparent */}
          <View style={styles.bottomOverlay} />
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
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: powmSpacing.lg,
    paddingBottom: powmSpacing.lg,
  },
  bottomOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: 120,
  },
  centerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 230,
    height: 230,
    borderRadius: powmRadii.md,
    borderWidth: 2,
    borderColor: powmColors.white,
    backgroundColor: 'transparent',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: powmRadii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    textAlign: 'center',
  },
  rightSpacer: {
    width: 40,
  },
  permissionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: powmSpacing.lg,
  },
  permissionButton: {
    paddingVertical: powmSpacing.md,
    paddingHorizontal: powmSpacing.xl,
    borderRadius: powmRadii.md,
    backgroundColor: powmColors.rowBackground,
  },
});
