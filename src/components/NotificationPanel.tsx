import { PowmText } from '@/components/powm';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { Bell, CheckCircle, Shield, X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const PANEL_WIDTH = width * 0.85;

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: Date;
  read: boolean;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
}

const NotificationItem = ({
  item,
  index,
  getIcon,
}: {
  item: Notification;
  index: number;
  getIcon: (type: string) => React.ReactNode;
}) => {
  // Animations for individual items: Slide Up + Fade In
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 100, // Staggered delay
        easing: Easing.out(Easing.back(1.5)), // Slight overshoot for "Lovable" feel
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.notificationItem,
        !item.read && styles.unreadItem,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.iconContainer}>{getIcon(item.type)}</View>
        <View style={styles.textContainer}>
          <PowmText variant="subtitleSemiBold" style={{ fontSize: 14 }}>
            {item.title}
          </PowmText>
          <PowmText
            variant="text"
            color={powmColors.inactive}
            style={{ fontSize: 13, marginTop: 4, lineHeight: 18 }}
          >
            {item.message}
          </PowmText>
        </View>
      </View>
    </Animated.View>
  );
};

export function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}: NotificationPanelProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(width)).current; // Start off-screen
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      // Entrance Animation
      Animated.parallel([
        // Spring animation for the panel (Lovable style)
        Animated.spring(slideAnim, {
          toValue: width - PANEL_WIDTH, // Slide to position
          damping: 25,
          stiffness: 250,
          mass: 0.8,
          useNativeDriver: true,
        }),
        // Smooth fade for backdrop
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Exit Animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color={powmColors.electricMain} />;
      case 'warning':
        return <Shield size={20} color={powmColors.orangeElectricMain} />;
      default:
        return <Bell size={20} color={powmColors.gray} />;
    }
  };

  if (!isOpen && backdropOpacity === new Animated.Value(0)) return null;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Sliding Panel */}
        <Animated.View
          style={[
            styles.panel,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              transform: [{ translateX: slideAnim }],
              // Using absolute positioning for the slide anim relative to screen width
              right: undefined, 
              left: 0, 
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <PowmText variant="subtitle">Notifications</PowmText>
            <View style={styles.headerActions}>
              {notifications.some((n) => !n.read) && (
                <TouchableOpacity
                  onPress={onMarkAllRead}
                  style={styles.markReadBtn}
                >
                  <PowmText
                    variant="text"
                    color={powmColors.electricMain}
                    style={{ fontSize: 12 }}
                  >
                    Mark all read
                  </PowmText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={10}
              >
                <X size={24} color={powmColors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* List */}
          <View style={styles.listContainer}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell
                  size={48}
                  color={powmColors.inactive}
                  style={{ opacity: 0.3, marginBottom: 12 }}
                />
                <PowmText variant="text" color={powmColors.inactive}>
                  No notifications yet
                </PowmText>
              </View>
            ) : (
              notifications.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  item={notification}
                  index={index}
                  getIcon={getIcon}
                />
              ))
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)', // Simulates the backdrop-blur
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: 'rgba(20, 18, 28, 0.98)', // Deep dark background
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: -10, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: powmSpacing.lg,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: powmSpacing.md,
  },
  markReadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(160, 107, 255, 0.1)',
    borderRadius: powmRadii.sm,
  },
  closeBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  listContainer: {
    flex: 1,
    padding: powmSpacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationItem: {
    padding: powmSpacing.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: powmRadii.md,
    marginBottom: powmSpacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
  },
  unreadItem: {
    borderLeftWidth: 3,
    borderLeftColor: powmColors.electricMain,
    backgroundColor: 'rgba(160, 107, 255, 0.05)',
  },
  row: {
    flexDirection: 'row',
    gap: powmSpacing.md,
  },
  iconContainer: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
});