import { Notification, NotificationPanel } from '@/components/NotificationPanel';
import {
  BackgroundImage,
  Column,
  PowmIcon,
  PowmText,
  Row,
  TicketCard,
} from '@/components/powm';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Animated wrapper for home items (Entrance animation)
 */
const AnimatedItem = ({
  children,
  index,
  style,
}: {
  children: React.ReactNode;
  index: number;
  style?: any;
}) => {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay: index * 100,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animation for the shiny gradient overlay
  const gradientShine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gradient "Shine" Animation
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
  ]);

  // -- Ticket Modal State --
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<{
    firstname?: string;
    lastname?: string;
    age?: string;
    country?: string;
  } | null>(null);
  const [ticketId, setTicketId] = useState('');

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
    setCurrentTicket({ firstname: 'John', lastname: 'Doe' });
    setTicketId(generateTicketId());
    setShowTicketModal(true);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <BackgroundImage>
      <View style={styles.container}>
        <NotificationPanel
          isOpen={isNotificationPanelOpen}
          onClose={() => setIsNotificationPanelOpen(false)}
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + powmSpacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Row justify="space-between" align="center" style={styles.header}>
            <PowmText variant="title">Welcome</PowmText>
            <View style={{ width: 48, height: 48 }} />
          </Row>

          {/* 1. SHINY QR Code Scanner Card */}
          <AnimatedItem index={0}>
            <Pressable
              onPress={() => console.log('Navigate to Scan')}
              style={({ pressed }) => [
                styles.qrCardContainer,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <ImageBackground
                source={require('@/assets/powm/illustrations/powm_draw.png')}
                style={styles.qrCardBg}
                imageStyle={styles.qrCardImage}
                resizeMode="cover"
              >
                {/* Base Gradient (Deep Purple/Indigo) */}
                <LinearGradient
                  colors={[
                    '#3b0764', // Deep rich purple
                    '#1e1b4b', // Very dark indigo middle
                    '#4c1d95', // Violet end
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.8, y: 1 }}
                  style={[StyleSheet.absoluteFill, { opacity: 0.85 }]}
                />

                {/* Animated "Shine" Overlay (Vibrant Pink/Magenta) */}
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradientShine }]}>
                  <LinearGradient
                    colors={[
                      'rgba(236, 72, 153, 0.5)', // Hot pink/Magenta highlight start
                      'rgba(139, 92, 246, 0.1)', // Subtle violet middle
                      'rgba(217, 70, 239, 0.5)', // Fuchsia highlight end
                    ]}
                    start={{ x: 0.1, y: 0.1 }}
                    end={{ x: 0.9, y: 0.9 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>

                <View style={styles.qrCardContent}>
                  <Column gap={powmSpacing.sm}>
                    <PowmText variant="subtitle" color="#e9d5ff"> 
                      Prove your age or identity
                    </PowmText>
                    <PowmText variant="title" style={{ fontSize: 28, color: '#ffffff' }}>QRcode Scanner</PowmText>
                    <PowmText variant="text" color="#c0a0e0">
                      Website requests you to scan to prove your age to access.
                    </PowmText>

                    {/* Static Icon Container (No Pulse, No Border) */}
                    <View style={styles.qrIconContainer}>
                      <View style={styles.qrIcon}>
                        <PowmIcon name="qrcode" size={54} color={powmColors.white} />
                      </View>
                    </View>
                  </Column>
                </View>
              </ImageBackground>
            </Pressable>
          </AnimatedItem>

          {/* ID Tickets Section */}
          <Column gap={powmSpacing.sm} style={styles.ticketsSection}>
            <AnimatedItem index={1}>
              <PowmText variant="subtitle" style={{ marginLeft: 4, marginBottom: 4 }}>
                ID Tickets
              </PowmText>
            </AnimatedItem>

            {/* 2. Create an ID Ticket */}
            <AnimatedItem index={2}>
              <Pressable
                onPress={() => router.push('/create-ticket')}
                style={styles.glassCard}
              >
                <Row gap={16} align="center">
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: 'rgba(255, 154, 46, 0.15)' },
                    ]}
                  >
                    <PowmIcon
                      name="add"
                      size={42}
                      color={powmColors.orangeElectricMain}
                    />
                  </View>
                  <Column flex={1} gap={2}>
                    <PowmText variant="subtitleSemiBold" style={{ fontSize: 16 }}>
                      Create an ID Ticket
                    </PowmText>
                    <PowmText variant="text" color={powmColors.inactive}>
                      Prove your identity to someone
                    </PowmText>
                  </Column>
                </Row>
              </Pressable>
            </AnimatedItem>

            {/* 3. Name Ticket */}
            <AnimatedItem index={3}>
              <View style={styles.glassCard}>
                 <TicketCard
                    icon={{
                      name: 'powmLogo',
                      backgroundColor: 'rgba(160, 107, 255, 0.15)',
                      color: powmColors.electricMain,
                      size: 48,
                    }}
                    title="Name"
                    subtitle="First and Lastname Proof"
                    showSeeButton
                    onSeePress={handleSeeTicket}
                    style={{ backgroundColor: 'transparent', padding: 0 }}
                  />
              </View>
            </AnimatedItem>
          </Column>
          
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bell Button */}
        <Pressable
          style={[styles.bellButton, { top: insets.top + powmSpacing.lg }]}
          onPress={() => setIsNotificationPanelOpen(true)}
        >
          <PowmIcon name="bell" size={24} color={powmColors.white} />
          {notifications.some((n) => !n.read) && (
            <View style={styles.notificationDot} />
          )}
        </Pressable>

        {/* Ticket Modal */}
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
                    <Row
                      justify="space-between"
                      align="flex-start"
                      style={styles.modalTicketContent}
                    >
                      <Column gap={powmSpacing.xs}>
                        {currentTicket.firstname && (
                          <PowmText variant="title">
                            {currentTicket.firstname}
                          </PowmText>
                        )}
                        {currentTicket.lastname && (
                          <PowmText variant="text">
                            {currentTicket.lastname}
                          </PowmText>
                        )}
                      </Column>
                      <View style={styles.modalQrCode}>
                        <PowmIcon
                          name="qrcode"
                          size={80}
                          color={powmColors.mainBackground}
                        />
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: powmSpacing.lg,
  },
  header: {
    marginBottom: powmSpacing.xl,
    height: 48,
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
  glassCard: {
    backgroundColor: 'rgba(30, 28, 40, 0.6)',
    borderRadius: powmRadii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    marginBottom: powmSpacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // --- Shiny QR Card Styles ---
  qrCardContainer: {
    marginBottom: powmSpacing.xl,
    borderRadius: powmRadii.xl,
    shadowColor: '#ec4899', 
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  qrCardBg: {
    borderRadius: powmRadii.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(236, 72, 153, 0.5)', // Pink/Magenta border
  },
  qrCardImage: {
    opacity: 0.9,
    transform: [{ translateX: -800 }, { translateY: -500 }, { scale: 0.4 }],
  },
  qrCardContent: {
    padding: powmSpacing.lg,
    paddingVertical: powmSpacing.xl,
    alignItems: 'center',
  },
  qrIconContainer: {
    alignItems: 'center',
    marginTop: powmSpacing.md,
  },
  qrIcon: {
    width: 80,
    height: 80,
    borderRadius: powmRadii.full,
    backgroundColor: 'rgba(20, 18, 28, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    // Removed inner white border
  },
  
  ticketsSection: {
    marginBottom: powmSpacing.xxl,
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
    borderRadius: powmRadii.lg,
    overflow: 'hidden',
    backgroundColor: powmColors.mainBackgroundAlt,
  },
  modalCardImage: {
    opacity: 0.9,
    transform: [{ translateX: -800 }, { translateY: -500 }, { scale: 0.4 }],
  },
  modalCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.63)',
    borderRadius: powmRadii.lg,
  },
  modalCardContent: {
    padding: powmSpacing.lg,
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