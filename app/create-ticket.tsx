import {
  Card,
  Column,
  PowmIcon,
  PowmText,
  Row,
  Toggle,
} from '@/components/powm';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Easing, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Create Ticket Screen
 *
 * Allows users to create an ID ticket by selecting which information
 * to include (firstname, lastname, age, country).
 * Shows a preview of the ticket at the bottom.
 */

interface TicketInfo {
  firstname: boolean;
  lastname: boolean;
  age: boolean;
  country: boolean;
}

export default function CreateTicketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ticketInfo, setTicketInfo] = useState<TicketInfo>({
    firstname: true,
    lastname: false,
    age: true,
    country: false,
  });
  const [showTicket, setShowTicket] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [ticketAnimation] = useState(new Animated.Value(0));

  const toggleInfo = (key: keyof TicketInfo) => {
    setTicketInfo((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreateTicket = () => {
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    // TODO: Navigate to success screen or back to home
    router.back();
  };

  const toggleTicketView = () => {
    if (!showTicket) {
      setShowTicket(true);
      Animated.timing(ticketAnimation, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(ticketAnimation, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setShowTicket(false));
    }
  };

  const ticketTranslateY = ticketAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  // Generate random ticket ID (placeholder)
  const generateTicketId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 15; i++) {
      if (i === 7) id += ' ';
      else id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  const [ticketId] = useState(generateTicketId());

  return (
    <View style={styles.container}>
        {/* Overlay for ticket modal */}
        {showTicket && (
          <Pressable style={styles.overlay} onPress={toggleTicketView} />
        )}

        {/* Confirmation Popup */}
        {showConfirmation && (
          <>
            <Pressable style={styles.overlay} onPress={() => setShowConfirmation(false)} />
            <View style={styles.confirmationPopup}>
              <PowmText variant="subtitle" style={styles.confirmTitle}>
                Are you sure?
              </PowmText>
              <PowmText variant="text" color={powmColors.inactive} style={styles.confirmText}>
                This will create a new ID ticket with your selected information.
              </PowmText>
              <Row gap={powmSpacing.md} style={styles.confirmButtons}>
                <Pressable
                  style={[styles.confirmButton, styles.noButton]}
                  onPress={() => setShowConfirmation(false)}
                >
                  <Row gap={powmSpacing.sm} align="center">
                    <PowmIcon name="cross" size={20} color={powmColors.white} />
                    <PowmText variant="subtitleSemiBold">No</PowmText>
                  </Row>
                </Pressable>
                <Pressable
                  style={[styles.confirmButton, styles.yesButton]}
                  onPress={handleConfirm}
                >
                  <Row gap={powmSpacing.sm} align="center">
                    <PowmIcon name="check" size={20} color={powmColors.white} />
                    <PowmText variant="subtitleSemiBold">Yes</PowmText>
                  </Row>
                </Pressable>
              </Row>
            </View>
          </>
        )}

        <View style={[styles.content, { paddingTop: insets.top + powmSpacing.lg }]}>
          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={() => router.replace('/')}>
            <PowmIcon name="cross" size={24} color={powmColors.white} />
          </Pressable>

          {/* Header */}
          <Column gap={powmSpacing.sm} style={styles.header}>
            <PowmText variant="title">Creating an ID Ticket</PowmText>
            <PowmText variant="text" color={powmColors.inactive} style={styles.headerDescription}>
              Sharing an ID Ticket is a way for you to prove desired informations about you to
              other Powm users.
            </PowmText>
          </Column>

          {/* Information Selection */}
          <Column gap={powmSpacing.base} style={styles.section}>
            <PowmText variant="subtitle" style={styles.sectionTitle}>
              Which information to link with this Ticket
            </PowmText>

            <Column gap={powmSpacing.sm}>
              <Row justify="space-between" align="center" style={styles.toggleRow}>
                <PowmText variant="subtitle">Firstname</PowmText>
                <Toggle value={ticketInfo.firstname} onValueChange={() => toggleInfo('firstname')} />
              </Row>

              <Row justify="space-between" align="center" style={styles.toggleRow}>
                <PowmText variant="subtitle">Lastname</PowmText>
                <Toggle value={ticketInfo.lastname} onValueChange={() => toggleInfo('lastname')} />
              </Row>

              <Row justify="space-between" align="center" style={styles.toggleRow}>
                <PowmText variant="subtitle">Age</PowmText>
                <Toggle value={ticketInfo.age} onValueChange={() => toggleInfo('age')} />
              </Row>

              <Row justify="space-between" align="center" style={styles.toggleRow}>
                <PowmText variant="subtitle">Country</PowmText>
                <Toggle value={ticketInfo.country} onValueChange={() => toggleInfo('country')} />
              </Row>
            </Column>
          </Column>

          {/* Create Button */}
          <Card onPress={handleCreateTicket} style={styles.createButton} variant="alt">
            <Row gap={powmSpacing.base} align="center">
              <View style={[styles.createButtonIcon, { backgroundColor: powmColors.electricFade }]}>
                <PowmIcon name="check" size={40} color={powmColors.electricMain} />
              </View>
              <Column flex={1} gap={powmSpacing.xs}>
                <PowmText variant="subtitleSemiBold">Create this ticket</PowmText>
              </Column>
            </Row>
          </Card>
        </View>

        {/* Ticket Preview Card (bottom) */}
        <Animated.View
          style={[
            styles.ticketPreview,
            {
              transform: [{ translateY: ticketTranslateY }],
            },
          ]}
        >
          <Pressable onPress={toggleTicketView}>
            <ImageBackground
              source={require('@/assets/powm/illustrations/powm_draw.png')}
              style={styles.ticketCard}
              imageStyle={styles.ticketCardImage}
              resizeMode="cover"
            >
              <View style={styles.ticketCardOverlay} />
              <View style={styles.ticketCardContent}>
                <Column gap={powmSpacing.sm}>
                  <PowmText variant="text" color={powmColors.inactive}>
                    Powm ID Ticket
                  </PowmText>
                  <PowmText variant="title">{ticketId}</PowmText>
                  <PowmText variant="text" color={powmColors.inactive}>
                    Available for 24H
                  </PowmText>

                  <Row justify="space-between" align="flex-start" style={styles.ticketContent}>
                    <Column gap={powmSpacing.xs}>
                      {ticketInfo.firstname && <PowmText variant="title">John</PowmText>}
                      {ticketInfo.age && <PowmText variant="subtitle">21 Year old</PowmText>}
                      {ticketInfo.lastname && <PowmText variant="text">Doe</PowmText>}
                      {ticketInfo.country && <PowmText variant="text">France</PowmText>}
                    </Column>

                    {/* QR Code */}
                    <View style={styles.qrCode}>
                      <PowmIcon name="qrcode" size={80} color={powmColors.mainBackground} />
                    </View>
                  </Row>
                </Column>
              </View>
            </ImageBackground>
          </Pressable>
        </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: powmColors.mainBackground,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 998,
  },
  content: {
    paddingHorizontal: powmSpacing.lg,
    paddingBottom: powmSpacing.xxl,
  },
  closeButton: {
    width: 48,
    height: 48,
    marginBottom: powmSpacing.xl,
  },
  header: {
    marginBottom: powmSpacing.xl,
  },
  headerDescription: {
    marginLeft: powmSpacing.md,
    marginRight: powmSpacing.md,
    marginTop: powmSpacing.sm,
  },
  section: {
    marginBottom: powmSpacing.xl,
  },
  sectionTitle: {
    marginBottom: powmSpacing.sm,
  },
  toggleRow: {
    paddingVertical: powmSpacing.xs,
  },
  createButton: {
    padding: 13,
    backgroundColor: '#1F1938',
    marginBottom: powmSpacing.xl,
  },
  createButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: powmRadii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketPreview: {
    position: 'absolute',
    bottom: 80,
    left: powmSpacing.lg,
    right: powmSpacing.lg,
    zIndex: 999,
  },
  ticketCard: {
    borderRadius: powmRadii.md,
    overflow: 'hidden',
    backgroundColor: powmColors.mainBackgroundAlt,
  },
  ticketCardImage: {
    opacity: 0.9,
    transform: [
      { translateX: -800 },
      { translateY: -500 },
      { scale: 0.4 },
    ],
  },
  ticketCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.63)',
    borderRadius: powmRadii.md,
  },
  ticketCardContent: {
    padding: powmSpacing.base,
  },
  ticketContent: {
    marginTop: powmSpacing.md,
  },
  qrCode: {
    width: 100,
    height: 100,
    backgroundColor: powmColors.white,
    borderRadius: powmRadii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmationPopup: {
    position: 'absolute',
    top: '35%',
    left: powmSpacing.xl,
    right: powmSpacing.xl,
    backgroundColor: '#1A1824',
    borderRadius: powmRadii.lg,
    padding: powmSpacing.xl,
    zIndex: 999,
  },
  confirmTitle: {
    marginBottom: powmSpacing.md,
    textAlign: 'center',
  },
  confirmText: {
    marginBottom: powmSpacing.xl,
    textAlign: 'center',
  },
  confirmButtons: {
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: powmSpacing.md,
    paddingHorizontal: powmSpacing.lg,
    borderRadius: powmRadii.md,
    alignItems: 'center',
  },
  noButton: {
    backgroundColor: powmColors.mainBackgroundAlt,
  },
  yesButton: {
    backgroundColor: powmColors.electricMain,
  },
});
