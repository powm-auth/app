import {
  BackgroundImage,
  Card,
  Column,
  FootBar,
  PowmIcon,
  PowmText,
  Row,
  TicketCard,
} from '@/components/powm';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Home Screen
 *
 * Main landing page of Powm app.
 * Features:
 * - QR Code Scanner section
 * - ID Tickets list
 * - Navigation to scanning/creating tickets
 */
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showNotifications, setShowNotifications] = useState(false);
  const [popupAnimation] = useState(new Animated.Value(0));

  const toggleNotifications = () => {
    if (!showNotifications) {
      setShowNotifications(true);
      Animated.timing(popupAnimation, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(popupAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowNotifications(false));
    }
  };

  // Ouvre l’écran de scan (si tu as créé /scan.tsx)
  const openScanner = () => {
    router.push('/scan' as any);
  };

  // Swipe gauche/droite : History ⇄ Home ⇄ Profile
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => {
        const { dx, dy } = gesture;
        return Math.abs(dx) > 20 && Math.abs(dy) < 10; // uniquement gestes horizontaux
      },
      onPanResponderRelease: (_evt, gesture) => {
        const { dx } = gesture;
        if (dx < -50) {
          // swipe gauche -> page à droite : Profile
          router.push('/profile' as any);
        } else if (dx > 50) {
          // swipe droite -> page à gauche : History
          router.push('/history' as any);
        }
      },
    })
  ).current;

  return (
    <BackgroundImage>
      <View style={styles.container} {...panResponder.panHandlers}>
        {/* Overlay to close notification popup */}
        {showNotifications && <Pressable style={styles.overlay} onPress={toggleNotifications} />}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + powmSpacing.lg }]}
        >
          {/* Header with Welcome and Bell (placeholder for spacing) */}
          <Row justify="space-between" align="center" style={styles.header}>
            <PowmText variant="title">Welcome</PowmText>
            <View style={{ width: 48, height: 48 }} />
          </Row>

          {/* QR Code Scanner Card */}
          <Pressable onPress={openScanner} style={styles.qrCardPressable}>
            <ImageBackground
              source={require('@/assets/powm/illustrations/powm_draw.png')}
              style={styles.qrCard}
              imageStyle={styles.qrCardImage}
              resizeMode="cover"
            >
              <View style={styles.qrCardOverlay} />
              <View style={styles.qrCardContent}>
                <Column gap={powmSpacing.sm}>
                  <PowmText variant="subtitle" color={powmColors.white}>
                    Prove your age or identity
                  </PowmText>
                  <PowmText variant="title">QRcode Scanner</PowmText>
                  <PowmText variant="text" color={powmColors.inactive}>
                    Website requests you to scan to prove your age to access.
                  </PowmText>

                  {/* QR Code Icon */}
                  <View style={styles.qrIconContainer}>
                    <View style={styles.qrIcon}>
                      <PowmIcon name="qrcode" size={54} color={powmColors.gray} />
                    </View>
                  </View>
                </Column>
              </View>
            </ImageBackground>
          </Pressable>

          {/* ID Tickets Section */}
          <Column gap={powmSpacing.sm} style={styles.ticketsSection}>
            <PowmText variant="subtitle">ID Tickets</PowmText>

            {/* Scan an ID Ticket */}
            <Card onPress={openScanner} style={styles.scanTicketCard} variant="alt">
              <Row gap={powmSpacing.base} align="center">
                <View style={[styles.ticketIcon, { backgroundColor: powmColors.scanButtonBg }]}>
                  <PowmIcon name="qrcode" size={32} color={powmColors.activeElectricMain} />
                </View>
                <Column flex={1} gap={powmSpacing.xs}>
                  <PowmText variant="subtitleSemiBold">Scan an ID Ticket</PowmText>
                  <PowmText variant="text" color={powmColors.inactive}>
                    Check info from a QRCode
                  </PowmText>
                </Column>
              </Row>
            </Card>

            {/* Name Ticket */}
            <TicketCard
              icon={{
                name: 'powmLogo',
                backgroundColor: powmColors.electricFade,
                color: powmColors.electricMain,
                size: 48,
              }}
              title="Name"
              subtitle="First and Lastname Proof"
              showSeeButton
              onSeePress={() => console.log('See Name ticket')}
              style={styles.ticketCard}
            />

            {/* Create an ID Ticket */}
            <Card
              onPress={() => router.push('/create-ticket' as any)}
              style={styles.ticketCard}
              variant="alt"
            >
              <Row gap={powmSpacing.base} align="center">
                <View
                  style={[styles.ticketIcon, { backgroundColor: powmColors.orangeElectricFade }]}
                >
                  <PowmIcon name="add" size={48} color={powmColors.orangeElectricMain} />
                </View>
                <Column flex={1} gap={powmSpacing.xs}>
                  <PowmText variant="subtitleSemiBold">Create an ID Ticket</PowmText>
                  <PowmText variant="text" color={powmColors.inactive}>
                    Prove your identity to someone
                  </PowmText>
                </Column>
              </Row>
            </Card>
          </Column>
        </ScrollView>

        {/* Bell Button - Outside ScrollView for proper z-index */}
        <Pressable
          style={[
            styles.bellButton,
            {
              top: insets.top + powmSpacing.lg,
            },
          ]}
          onPress={toggleNotifications}
        >
          <PowmIcon name="bell" size={24} color={powmColors.white} />
        </Pressable>

        {/* Notification Popup - Outside ScrollView for proper z-index */}
        {showNotifications && (
          <Animated.View
            style={[
              styles.notificationPopup,
              {
                top: insets.top + powmSpacing.lg,
                opacity: popupAnimation,
              },
            ]}
          >
            <PowmText variant="subtitle" style={styles.notificationText}>
              No notifications
            </PowmText>
          </Animated.View>
        )}

        {/* Bottom Navigation */}
        <FootBar />
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: powmSpacing.lg,
    paddingBottom: powmSpacing.xxl,
  },
  header: {
    marginBottom: powmSpacing.xl,
  },
  bellButton: {
    position: 'absolute',
    right: powmSpacing.lg,
    width: 48,
    height: 48,
    borderRadius: powmRadii.full,
    backgroundColor: 'rgba(42, 40, 52, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  notificationPopup: {
    position: 'absolute',
    right: powmSpacing.lg,
    backgroundColor: powmColors.rowBackground,
    borderTopLeftRadius: powmRadii.md,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: powmRadii.md,
    borderBottomRightRadius: powmRadii.md,
    padding: powmSpacing.lg,
    width: 280,
    minHeight: 120, // 2.5 times the bell circle height (48px)
    justifyContent: 'flex-end',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  notificationText: {
    textAlign: 'center',
  },
  qrCardPressable: {
    marginBottom: powmSpacing.xl,
    borderRadius: powmRadii.md,
    overflow: 'hidden',
  },
  qrCard: {
    borderRadius: powmRadii.md,
    overflow: 'hidden',
    backgroundColor: powmColors.mainBackgroundAlt,
  },
  qrCardImage: {
    opacity: 0.9,
    transform: [{ translateX: -800 }, { translateY: -500 }, { scale: 0.4 }],
  },
  qrCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.63)',
    borderRadius: powmRadii.md,
  },
  qrCardContent: {
    padding: powmSpacing.base,
  },
  qrIconContainer: {
    alignItems: 'center',
    marginTop: powmSpacing.base,
    marginBottom: powmSpacing.base,
  },
  qrIcon: {
    width: 80,
    height: 80,
    borderRadius: powmRadii.full,
    backgroundColor: '#7d7c8556',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketsSection: {
    marginBottom: powmSpacing.xxl,
  },
  ticketCard: {
    padding: 13,
    backgroundColor: powmColors.rowBackground,
  },
  scanTicketCard: {
    padding: 13,
    backgroundColor: powmColors.scanButtonBg,
    marginBottom: powmSpacing.sm,
  },
  ticketIcon: {
    width: 48,
    height: 48,
    borderRadius: powmRadii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
