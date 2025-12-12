import {
    AnimatedEntry,
    BackgroundImage,
    PowmIcon,
    PowmText,
    Row
} from '@/components';
import { Notification, NotificationPanel } from '@/components/NotificationPanel';
import { ScannerCard } from '@/components/home/ScannerCard';
import { getCurrentWallet } from '@/services/wallet-service';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const wallet = getCurrentWallet();
    const firstName = wallet?.attributes?.first_name?.value || 'User';

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
                        <PowmText variant="title">Welcome {firstName}!</PowmText>
                        <View style={{ width: 48, height: 48 }} />
                    </Row>

                    {/* 1. Scanner Card */}
                    <AnimatedEntry index={0}>
                        <View style={{ marginBottom: powmSpacing.xxl * 1.5 }}>
                            <ScannerCard onPress={() => {
                                router.push('/scan');
                            }} />
                        </View>
                    </AnimatedEntry>

                    {/* Wallet-to-Wallet Identity Exchange */}
                    <AnimatedEntry index={1}>
                        <Pressable
                            onPress={() => router.push('/request-identity')}
                            style={({ pressed }) => [
                                styles.requestIdentityCard,
                                pressed && { opacity: 0.8 },
                            ]}
                        >
                            <View style={styles.requestIdentityBorder}>
                                <View style={styles.requestIdentityContent}>
                                    <View style={styles.requestIdentityIcon}>
                                        <PowmIcon name="id" size={32} color={powmColors.electricMain} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <PowmText variant="subtitleSemiBold" style={{ fontSize: 18, marginBottom: 4 }}>
                                            Request Identity
                                        </PowmText>
                                        <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 14 }}>
                                            Verify someone's identity with a QR code
                                        </PowmText>
                                    </View>
                                    <PowmIcon name="chevron" size={20} color={powmColors.electricMain} />
                                </View>
                            </View>
                        </Pressable>
                    </AnimatedEntry>

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
    requestIdentityCard: {
        width: '100%',
        borderRadius: powmRadii.xl,
    },
    requestIdentityBorder: {
        borderRadius: powmRadii.xl,
        borderWidth: 1,
        borderColor: 'rgba(151, 71, 255, 0.3)',
        backgroundColor: 'rgba(42, 40, 52, 0.6)',
        overflow: 'hidden',
    },
    requestIdentityContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: powmSpacing.md,
        padding: powmSpacing.lg,
    },
    requestIdentityIcon: {
        width: 56,
        height: 56,
        borderRadius: powmRadii.lg,
        backgroundColor: 'rgba(151, 71, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
});
