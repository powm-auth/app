import { Notification, NotificationPanel } from '@/components/NotificationPanel';
import {
  BackgroundImage,
  Card,
  Column,
  PowmIcon,
  PowmText,
  Row,
  TicketCard
} from '@/components/powm';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Home Screen
 */
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // -- Notification State --
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Welcome to Powm',
      message: 'Secure your identity with our new encrypted tickets.',
      type: 'info',
      timestamp: new Date(),
      read: false,
    },
    {
      id: '2',
      title: 'Verification Complete',
      message: 'Your age verification was successful.',
      type: 'success',
      timestamp: new Date(),
      read: true,
    }
  ]);

  // -- Ticket Modal State --
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<{ firstname?: string; lastname?: string; age?: string; country?: string } | null>(null);
  const [ticketId, setTicketId] = useState('');

  // Generate random ticket ID
  const generateTicketId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 15; i++) {
      if (i === 7) id += ' ';
      else id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  const handleSeeTicket = () => {
    setCurrentTicket({
      firstname: 'John',
      lastname: 'Doe',
    });
    setTicketId(generateTicketId());
    setShowTicketModal(true);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <BackgroundImage>
      <View style={styles.container}>
        
        {/* New Notification Panel */}
        <NotificationPanel 
          isOpen={isNotificationPanelOpen}
          onClose={() => setIsNotificationPanelOpen(false)}
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + powmSpacing.lg }]}
        >
          {/* Header */}
          <Row justify="space-between" align="center" style={styles.header}>
            <PowmText variant="title">Welcome</PowmText>
            {/* Spacer to balance the absolute positioned bell */}
            <View style={{ width: 48, height: 48 }} />
          </Row>

          {/* QR Code Scanner Card */}
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

                <View style={styles.qrIconContainer}>
                  <View style={styles.qrIcon}>
                    <PowmIcon name="qrcode" size={54} color={powmColors.gray} />
                  </View>
                </View>
              </Column>
            </View>
          </ImageBackground>

          {/* ID Tickets Section */}
          <Column gap={powmSpacing.sm} style={styles.ticketsSection}>
            <PowmText variant="subtitle">ID Tickets</PowmText>

            {/* 1. Create an ID Ticket (Moved to top as requested) */}
            <Card
              onPress={() => router.push('/create-ticket')}
              style={styles.createTicketCard} 
              variant="alt"
            >
              <Row gap={powmSpacing.base} align="center">
                <View style={[styles.ticketIcon, { backgroundColor: powmColors.orangeElectricFade }]}>
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

            {/* 2. Name Ticket */}
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
              onSeePress={handleSeeTicket}
              style={styles.ticketCard}
            />
          </Column>
        </ScrollView>

        {/* Bell Button */}
        <Pressable
          style={[
            styles.bellButton,
            { top: insets.top + powmSpacing.lg },
          ]}
          onPress={() => setIsNotificationPanelOpen(true)}
        >
          <PowmIcon name="bell" size={24} color={powmColors.white} />
          {notifications.some(n => !n.read) && (
             <View style={styles.notificationDot} />
          )}
        </Pressable>

        {/* Ticket Modal Overlay */}
        {showTicketModal && currentTicket && (
          <>
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setShowTicketModal(false)}
            />
            <View style={styles.modalContainer}>
              <ImageBackground
                source={require('@/assets/powm/illustrations/powm_draw.png')}
                style={styles.modalCard}
                imageStyle={styles.modalCardImage}
                resizeMode="cover"
              >
                <View style={styles.modalCardOverlay} />
                <View style={styles.modalCardContent}>
                  <Column gap={powmSpacing.sm}>
                    <PowmText variant="text" color={powmColors.inactive}>
                      Powm ID Ticket
                    </PowmText>
                    <PowmText variant="title">{ticketId}</PowmText>
                    <PowmText variant="text" color={powmColors.inactive}>
                      Available for 24H
                    </PowmText>
                    <Row justify="space-between" align="flex-start" style={styles.modalTicketContent}>
                      <Column gap={powmSpacing.xs}>
                        {currentTicket.firstname && (
                          <PowmText variant="title">{currentTicket.firstname}</PowmText>
                        )}
                        {currentTicket.lastname && (
                          <PowmText variant="text">{currentTicket.lastname}</PowmText>
                        )}
                      </Column>
                      <View style={styles.modalQrCode}>
                        <PowmIcon name="qrcode" size={80} color={powmColors.mainBackground} />
                      </View>
                    </Row>
                  </Column>
                </View>
              </ImageBackground>
            </View>
          </>
        )}
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
    zIndex: 1000,
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: powmColors.orangeElectricMain,
    borderWidth: 1,
    borderColor: 'rgba(42, 40, 52, 0.8)',
  },
  qrCard: {
    marginBottom: powmSpacing.xl,
    borderRadius: powmRadii.md,
    overflow: 'hidden',
    backgroundColor: powmColors.mainBackgroundAlt,
  },
  qrCardImage: {
    opacity: 0.9,
    transform: [
      { translateX: -800 },
      { translateY: -500 },
      { scale: 0.4 },
    ],
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
  // Reused styling for the Create Ticket Card to match the old Scan button's prominence if desired,
  // or simply match standard ticket cards.
  createTicketCard: {
    padding: 13,
    backgroundColor: powmColors.rowBackground, 
    marginBottom: powmSpacing.sm,
  },
  ticketIcon: {
    width: 48,
    height: 48,
    borderRadius: powmRadii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal Styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 998,
  },
  modalContainer: {
    position: 'absolute',
    top: '30%',
    left: powmSpacing.lg,
    right: powmSpacing.lg,
    zIndex: 999,
  },
  modalCard: {
    borderRadius: powmRadii.md,
    overflow: 'hidden',
    backgroundColor: powmColors.mainBackgroundAlt,
  },
  modalCardImage: {
    opacity: 0.9,
    transform: [
      { translateX: -800 },
      { translateY: -500 },
      { scale: 0.4 },
    ],
  },
  modalCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.63)',
    borderRadius: powmRadii.md,
  },
  modalCardContent: {
    padding: powmSpacing.base,
  },
  modalTicketContent: {
    marginTop: powmSpacing.md,
  },
  modalQrCode: {
    width: 100,
    height: 100,
    backgroundColor: powmColors.white,
    borderRadius: powmRadii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});