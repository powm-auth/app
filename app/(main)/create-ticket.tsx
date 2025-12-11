import {
  Card,
  Column,
  GlassCard,
  ListItem,
  PowmIcon,
  PowmText,
  Row,
  Toggle
} from '@/components';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Easing, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
      {showTicket && (
        <Pressable style={styles.overlay} onPress={toggleTicketView} />
      )}

      {showConfirmation && (
        <>
          <Pressable style={styles.overlay} onPress={() => setShowConfirmation(false)} />
          <View style={styles.confirmationPopupContainer}>
            <GlassCard style={styles.confirmationPopup}>
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
            </GlassCard>
          </View>
        </>
      )}

      <View style={[styles.content, { paddingTop: insets.top + powmSpacing.lg }]}>
        <Pressable style={styles.closeButton} onPress={() => router.replace('/home')}>
          <PowmIcon name="cross" size={24} color={powmColors.white} />
        </Pressable>

        <Column gap={powmSpacing.sm} style={styles.header}>
          <PowmText variant="title">Creating an ID Ticket</PowmText>
          <PowmText variant="text" color={powmColors.inactive} style={styles.headerDescription}>
            Sharing an ID Ticket is a way for you to prove desired informations about you to
            other Powm users.
          </PowmText>
        </Column>

        <Column gap={powmSpacing.base} style={styles.section}>
          <PowmText variant="subtitle" style={styles.sectionTitle}>
            Which information to link with this Ticket
          </PowmText>

          <GlassCard padding={0}>
            <ListItem
              title="Firstname"
              rightElement={<Toggle value={ticketInfo.firstname} onValueChange={() => toggleInfo('firstname')} />}
              showChevron={false}
            />
            <View style={styles.separator} />
            <ListItem
              title="Lastname"
              rightElement={<Toggle value={ticketInfo.lastname} onValueChange={() => toggleInfo('lastname')} />}
              showChevron={false}
            />
            <View style={styles.separator} />
            <ListItem
              title="Age"
              rightElement={<Toggle value={ticketInfo.age} onValueChange={() => toggleInfo('age')} />}
              showChevron={false}
            />
            <View style={styles.separator} />
            <ListItem
              title="Country"
              rightElement={<Toggle value={ticketInfo.country} onValueChange={() => toggleInfo('country')} />}
              showChevron={false}
            />
          </GlassCard>
        </Column>

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
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  confirmationPopupContainer: {
    position: 'absolute',
    top: '35%',
    left: powmSpacing.xl,
    right: powmSpacing.xl,
    zIndex: 999,
  },
  confirmationPopup: {
    padding: powmSpacing.xl,
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
